import TextField, { type TextFieldProps } from '@mui/material/TextField';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';

type ControllableTextFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
} & Omit<TextFieldProps, 'name' | 'error' | 'helperText' | 'value' | 'defaultValue'>;

export default function ControllableTextField<TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  ...textFieldProps
}: ControllableTextFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          {...textFieldProps}
        />
      )}
    />
  );
}
