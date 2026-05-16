import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'underline' | 'boxed'
}

const BASE =
  'w-full bg-transparent rounded-none ' +
  'text-[13px] font-light text-md-black dark:text-md-white ' +
  'placeholder:text-md-dark-grey placeholder:uppercase placeholder:tracking-[0.04em] placeholder:text-[12px] ' +
  'focus:outline-none transition-colors duration-[278ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ' +
  'disabled:text-md-dark-grey'

const VARIANTS: Record<NonNullable<InputProps['variant']>, string> = {
  underline:
    'border-0 border-b border-md-sk-grey px-0 py-3 ' +
    'focus:border-md-black dark:focus:border-md-white',
  boxed:
    'border border-md-sk-grey px-4 py-3 ' +
    'focus:border-md-black dark:focus:border-md-white',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'underline', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`${BASE} ${VARIANTS[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
