import { HTMLAttributes, forwardRef } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Define el padding interno. Default `lg` (p-8). */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Si es true, no dibuja borde (útil para cards "embedded"). */
  borderless?: boolean
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'lg', borderless = false, ...props }, ref) => {
    const border = borderless
      ? ''
      : 'border border-md-sk-grey dark:border-[color:var(--border)]'
    return (
      <div
        ref={ref}
        className={`bg-md-white dark:bg-md-black rounded-none ${border} ${PADDING[padding]} ${className}`}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

export default Card
