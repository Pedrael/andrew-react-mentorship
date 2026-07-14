import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { QuestionDialogData, QuestionEditValues } from './types';

type UseQuestionEditorArgs = {
  question: QuestionDialogData | null;
  isAdmin: boolean;
  onLiveEdit?: (data: { question: string; answer: string; image?: string }) => void;
};

export function useQuestionEditor({ question, isAdmin, onLiveEdit }: UseQuestionEditorArgs) {
  const { control, reset, getValues, watch } = useForm<QuestionEditValues>({
    defaultValues: { question: '', answer: '', image: '' },
  });
  const editImage = watch('image');

  useEffect(() => {
    reset({
      question: question?.question ?? '',
      answer: question?.answer ?? '',
      image: question?.image ?? '',
    });
  }, [question, reset]);

  const onLiveEditRef = useRef(onLiveEdit);
  useEffect(() => {
    onLiveEditRef.current = onLiveEdit;
  });

  useEffect(() => {
    if (!isAdmin || !question) return;
    const subscription = watch((values) => {
      onLiveEditRef.current?.({
        question: values.question ?? '',
        answer: values.answer ?? '',
        image: values.image?.trim() || undefined,
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, isAdmin, question]);

  const getEditValues = () => {
    const { question: q, answer: a, image: img } = getValues();
    return {
      question: q,
      answer: a,
      image: img.trim() || undefined,
    };
  };

  return {
    control,
    editImage,
    getEditValues,
  };
}
