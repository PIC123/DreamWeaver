'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DisplayMessage, HistoryEntry } from '@/types/story';
import { useAuth } from '@/components/auth/AuthProvider';
import { postChat, postImage, postUploadImage } from '@/lib/api';
import { saveStory, loadStory } from '@/lib/storyService';
import { buildSystemPrompt } from '@/lib/prompt';
import { generateAnonToken } from '@/lib/storyId';
import { getAnonToken, setAnonToken } from '@/lib/anonStore';

export type StoryEngineState = {
  ready: boolean;
  setting: string;
  messages: DisplayMessage[];
  storyImages: string[];
  imgUrl: string | null;
  possibleActions: string[];
  isStoryLoading: boolean;
  isImageLoading: boolean;
  errorMessage: string | null;
};

export type UseStoryEngineOptions = {
  storyId: string;
  initialSetting?: string;
};

const PLACEHOLDER_IMG = 'https://raw.githubusercontent.com/PIC123/DreamWeaver/main/src/loading.png';

/**
 * Owns all story state + side effects. Source of truth for messages, images,
 * and history. All persistence + LLM calls go through server endpoints.
 */
export function useStoryEngine({ storyId, initialSetting }: UseStoryEngineOptions) {
  const { user } = useAuth();

  const [setting, setSetting] = useState(initialSetting ?? '');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [messageHistory, setMessageHistory] = useState<HistoryEntry[]>([]);
  const [storyImages, setStoryImages] = useState<string[]>([]);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [possibleActions, setPossibleActions] = useState<string[]>([]);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Anon token for this story (issued once when an anonymous story is born)
  const anonTokenRef = useRef<string | null>(null);
  const isAnonRef = useRef<boolean>(!user);
  const initStartedRef = useRef(false);

  // Latest snapshot for use inside async closures without stale state
  const latestRef = useRef({ messages, messageHistory, storyImages, imgUrl, possibleActions, setting });
  useEffect(() => {
    latestRef.current = { messages, messageHistory, storyImages, imgUrl, possibleActions, setting };
  }, [messages, messageHistory, storyImages, imgUrl, possibleActions, setting]);

  const persist = useCallback(
    async (overrides?: Partial<typeof latestRef.current>) => {
      const snap = { ...latestRef.current, ...(overrides ?? {}) };
      const { error } = await saveStory({
        storyId,
        userId: user?.id ?? null,
        setting: snap.setting,
        imgUrl: snap.imgUrl,
        storyImages: snap.storyImages,
        messageHistory: snap.messageHistory,
        messages: snap.messages,
        possibleActions: snap.possibleActions,
        isAnonymous: isAnonRef.current,
        anonToken: anonTokenRef.current,
      });
      if (error) console.error('saveStory error:', error);
    },
    [storyId, user?.id],
  );

  const generateImage = useCallback(
    async (prompt: string) => {
      setIsImageLoading(true);
      try {
        const openAIImageUrl = await postImage(prompt);
        const nextIndex = latestRef.current.storyImages.length;

        // Optimistic — show OpenAI URL immediately
        setImgUrl(openAIImageUrl);
        const optimisticImages = [...latestRef.current.storyImages, openAIImageUrl];
        setStoryImages(optimisticImages);
        setIsImageLoading(false);

        // Upload to Supabase via server endpoint
        try {
          const supabaseUrl = await postUploadImage({
            imageUrl: openAIImageUrl,
            storyId,
            imageIndex: nextIndex,
            anonToken: anonTokenRef.current,
          });
          const finalImages = [...optimisticImages];
          finalImages[nextIndex] = supabaseUrl;
          setImgUrl(supabaseUrl);
          setStoryImages(finalImages);
          await persist({ imgUrl: supabaseUrl, storyImages: finalImages });
        } catch (uploadErr) {
          console.warn('Image upload failed; keeping ephemeral OpenAI URL.', uploadErr);
          await persist({ imgUrl: openAIImageUrl, storyImages: optimisticImages });
        }
      } catch (err) {
        console.error('generateImage error:', err);
        setIsImageLoading(false);
      }
    },
    [persist, storyId],
  );

  const initNewStory = useCallback(
    async (newSetting: string) => {
      const systemPrompt = buildSystemPrompt(newSetting);
      const initialHistory: HistoryEntry[] = [['system', systemPrompt]];

      // Issue an anon token for this story if needed
      if (!user) {
        anonTokenRef.current = generateAnonToken();
        setAnonToken(storyId, anonTokenRef.current);
        isAnonRef.current = true;
      } else {
        anonTokenRef.current = null;
        isAnonRef.current = false;
      }

      setIsStoryLoading(true);
      try {
        const turn = await postChat({ setting: newSetting, history: initialHistory });
        const newMessages: DisplayMessage[] = [{ text: turn.storyText, sender: 'system' }];
        const newHistory: HistoryEntry[] = [
          ['system', systemPrompt],
          ['assistant', turn.storyText],
        ];
        setSetting(newSetting);
        setMessages(newMessages);
        setMessageHistory(newHistory);
        setPossibleActions(turn.possibleActions);
        setImgUrl(PLACEHOLDER_IMG);
        setIsStoryLoading(false);
        // Persist the text turn first; image upload will save again with the URL
        await persist({
          setting: newSetting,
          messages: newMessages,
          messageHistory: newHistory,
          possibleActions: turn.possibleActions,
          imgUrl: PLACEHOLDER_IMG,
          storyImages: [],
        });
        await generateImage(turn.dallEPrompt);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setErrorMessage(message);
        setIsStoryLoading(false);
      }
    },
    [persist, generateImage, storyId, user],
  );

  const loadExisting = useCallback(async () => {
    const { data, error } = await loadStory(storyId);
    if (error) {
      setErrorMessage(error.message);
      return false;
    }
    if (!data) return false;

    const cachedAnon = getAnonToken(storyId);
    if (cachedAnon) anonTokenRef.current = cachedAnon;
    isAnonRef.current = !!data.is_anonymous;

    setSetting(data.setting ?? '');
    setMessages(data.messages ?? []);
    setMessageHistory(data.message_history ?? []);
    setStoryImages(data.story_images ?? []);
    setImgUrl(data.img_url);
    setPossibleActions(data.possible_actions ?? []);
    return true;
  }, [storyId]);

  // Initialise once
  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;
    (async () => {
      const loaded = await loadExisting();
      if (!loaded && initialSetting) {
        await initNewStory(initialSetting);
      } else if (!loaded) {
        setErrorMessage('Story not found.');
      }
      setReady(true);
    })();
  }, [loadExisting, initNewStory, initialSetting]);

  const submitTurn = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) return;
      setErrorMessage(null);
      setIsStoryLoading(true);

      const trimmed = userInput.trim();
      const optimisticMessages: DisplayMessage[] = [
        ...latestRef.current.messages,
        { text: trimmed, sender: 'human' },
        { text: '✨ Weaving your tale...', sender: 'system' },
      ];
      setMessages(optimisticMessages);

      try {
        const turn = await postChat({
          setting: latestRef.current.setting,
          history: latestRef.current.messageHistory,
          userInput: trimmed,
        });

        const finalMessages: DisplayMessage[] = [
          ...latestRef.current.messages,
          { text: trimmed, sender: 'human' },
          { text: turn.storyText, sender: 'system' },
        ];
        const nextHistory: HistoryEntry[] = [
          ...latestRef.current.messageHistory,
          ['human', trimmed],
          ['assistant', turn.storyText],
        ];
        setMessages(finalMessages);
        setMessageHistory(nextHistory);
        setPossibleActions(turn.possibleActions);
        setIsStoryLoading(false);
        await persist({
          messages: finalMessages,
          messageHistory: nextHistory,
          possibleActions: turn.possibleActions,
        });
        await generateImage(turn.dallEPrompt);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message.includes('quota') || /429/.test(err.message)
              ? '⚠️ OpenAI API quota exceeded. Check your billing.'
              : err.message
            : 'An error occurred. Please try again.';
        const failureMessages: DisplayMessage[] = [
          ...latestRef.current.messages,
          { text: trimmed, sender: 'human' },
          { text: message, sender: 'system' },
        ];
        setMessages(failureMessages);
        setErrorMessage(message);
        setIsStoryLoading(false);
      }
    },
    [persist, generateImage],
  );

  return {
    state: {
      ready,
      setting,
      messages,
      storyImages,
      imgUrl,
      possibleActions,
      isStoryLoading,
      isImageLoading,
      errorMessage,
    } satisfies StoryEngineState,
    submitTurn,
  };
}
