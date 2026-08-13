import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type AppLogoIconProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'>;

export default function AppLogoIcon({ className, ...props }: AppLogoIconProps) {
    return (
        <span
            className={cn('inline-flex size-10 shrink-0', className)}
            {...props}
        >
            <img
                src="/images/brand/supreme-barbers-logo-light.webp"
                alt=""
                aria-hidden="true"
                className="size-full object-contain dark:hidden"
            />
            <img
                src="/images/brand/supreme-barbers-logo-dark.webp"
                alt=""
                aria-hidden="true"
                className="hidden size-full object-contain dark:block"
            />
        </span>
    );
}
