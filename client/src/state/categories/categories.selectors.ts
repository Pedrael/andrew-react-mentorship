import { createSelector } from '@reduxjs/toolkit';
import { categoriesApi } from './categories.api';
import type { Category } from './categories.types';

const selectCategoriesResult = categoriesApi.endpoints.getCategories.select();
const EMPTY_CATEGORIES: Category[] = [];

export const selectCategories = createSelector(
  selectCategoriesResult,
  (result) => result?.data ?? EMPTY_CATEGORIES,
);

export const selectCategoryByIndex = (index: number) =>
  createSelector(selectCategories, (categories) => categories[index] ?? null);
