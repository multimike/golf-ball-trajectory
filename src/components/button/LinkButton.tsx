import './Button.scss';

type Props = {
    children: React.ReactNode;
    href: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    target?: string;
    rel?: string;
    style?: React.CSSProperties;
}

export default function LinkButton({
    children,
    href,
    variant = 'primary',
    size = 'md',
    className = '',
    target,
    rel,
    style,
}: Props) {
    return (
        <a
            href={href}
            target={target}
            rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
            className={`btn btn-${variant} btn-${size} ${className}`}
            style={style}
        >
            {children}
        </a>
    );
}