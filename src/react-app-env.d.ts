/// <reference types="react-scripts" />

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof import('redux').compose;
  }
}

declare module 'formik' {
  import * as React from 'react';

  export interface FormikValues {
    [field: string]: any;
  }

  export type FormikErrors<Values> = {
    [K in keyof Values]?: any;
  };

  export type FormikTouched<Values> = {
    [K in keyof Values]?: any;
  };

  export interface FormikState<Values> {
    values: Values;
    errors: FormikErrors<Values>;
    touched: FormikTouched<Values>;
    isSubmitting: boolean;
    isValidating: boolean;
    status?: any;
    submitCount: number;
  }

  export interface FormikHelpers<Values> {
    setStatus: (status: any) => void;
    setErrors: (errors: FormikErrors<Values>) => void;
    setFieldError: (field: string, value: string | undefined) => void;
    setFieldTouched: (field: string, touched?: boolean, shouldValidate?: boolean) => Promise<void | FormikErrors<Values>>;
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => Promise<void | FormikErrors<Values>>;
    setTouched: (touched: FormikTouched<Values>, shouldValidate?: boolean) => Promise<void | FormikErrors<Values>>;
    setValues: (values: React.SetStateAction<Values>, shouldValidate?: boolean) => Promise<void | FormikErrors<Values>>;
    setSubmitting: (isSubmitting: boolean) => void;
    resetForm: (nextState?: Partial<FormikState<Values>>) => void;
    submitForm: () => Promise<any>;
    validateForm: (values?: Values) => Promise<FormikErrors<Values>>;
  }

  export interface FormikHandlers {
    handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
    handleReset: (e: any) => void;
    handleBlur: {
      (e: React.FocusEvent<any, Element>): void;
      <T = string | any>(fieldOrEvent: T): T extends string ? (e: any) => void : void;
    };
    handleChange: {
      (e: React.ChangeEvent<any>): void;
      <T = string | React.ChangeEvent<any>>(field: T): T extends React.ChangeEvent<any> ? void : (e: string | React.ChangeEvent<any>) => void;
    };
  }

  export interface FormikComputedProps<Values> {
    readonly dirty: boolean;
    readonly isValid: boolean;
    readonly initialValues: Values;
    readonly initialErrors: FormikErrors<Values>;
    readonly initialTouched: FormikTouched<Values>;
    readonly initialStatus: any;
  }

  export type FormikProps<Values> = FormikState<Values> &
    FormikHelpers<Values> &
    FormikHandlers &
    FormikComputedProps<Values> & {
      submitForm: () => Promise<any>;
      enableReinitialize?: boolean;
      validateOnChange?: boolean;
      validateOnBlur?: boolean;
      validateOnMount?: boolean;
    };

  export interface FormikConfig<Values> {
    initialValues: Values;
    initialStatus?: any;
    initialErrors?: FormikErrors<Values>;
    initialTouched?: FormikTouched<Values>;
    onSubmit: (values: Values, formikHelpers: FormikHelpers<Values>) => void | Promise<any>;
    onReset?: (values: Values, formikHelpers: FormikHelpers<Values>) => void;
    validationSchema?: any | (() => any);
    validate?: (values: Values) => void | object | Promise<FormikErrors<Values>>;
    enableReinitialize?: boolean;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    validateOnMount?: boolean;
    isInitialValid?: boolean | ((props: any) => boolean);
    component?: React.ComponentType<FormikProps<Values>>;
    render?: (props: FormikProps<Values>) => React.ReactNode;
    children?: ((props: FormikProps<Values>) => React.ReactNode) | React.ReactNode;
    innerRef?: React.Ref<FormikProps<Values>>;
  }

  export class Formik<Values extends FormikValues = FormikValues> extends React.Component<FormikConfig<Values>> {}
  export const Form: React.ComponentType<any>;
  export const ErrorMessage: React.ComponentType<any>;
  export const Field: React.ComponentType<any>;
  export const FastField: React.ComponentType<any>;
  export const FieldArray: React.ComponentType<any>;
}
