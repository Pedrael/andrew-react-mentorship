import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { Controller, type Control } from 'react-hook-form';

type ControlableTextFieldProps = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  rules: object;
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  disabled: boolean;
  fullWidth: boolean;
  required: boolean;
  helperText?: string;
  placeholder?: string;
  props?: TextFieldProps;
};

export default function ControlableTextField({
  name,
  control,
  rules,
  id,
  label,
  type,
  autoComplete,
  disabled,
  fullWidth,
  required,
  helperText,
  placeholder,
  ...props
}: ControlableTextFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          id={id}
          label={label}
          type={type}
          autoComplete={autoComplete}
          disabled={disabled}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          placeholder={placeholder}
          fullWidth={fullWidth}
          required={required}
          {...props}
        />
      )}
    />
  );
}
