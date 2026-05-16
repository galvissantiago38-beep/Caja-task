import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-md-black text-md-white hover:bg-md-dark-grey ' +
    'dark:bg-md-white dark:text-md-black dark:hover:bg-md-sk-grey',
  secondary:
    'bg-transparent text-md-black border border-md-black hover:bg-md-black hover:text-md-white ' +
    'dark:text-md-white dark:border-md-white dark:hover:bg-md-white dark:hover:text-md-black',
  ghost:
    'bg-transparent text-md-black hover:text-md-dark-grey ' +
    'dark:text-md-white dark:hover:text-md-sk-grey',
}

const BASE =
  'inline-flex items-center justify-center px-8 py-3 ' +
  'text-[13px] font-light uppercase tracking-[0.16em] ' +
  'rounded-none transition-all duration-[278ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ' +
  'disabled:opacity-40 disabled:cursor-not-allowed'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${BASE} ${VARIANTS[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
