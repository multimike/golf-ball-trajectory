import './Select.scss';

type Option = {
    value: string | number;
    label: string;
}

type Props = {
    label: string;
    value: string | number;
    options: Option[];
    onChange: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function Select({ label, value, options, onChange, placeholder, disabled }: Props) {
    return (
        <div className={`select-container ${disabled ? 'is-disabled' : ''}`}>
            <label className="input-label">{label}</label>
            <div className="select-wrapper">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="select-field"
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <span className="select-chevron">▼</span>
            </div>
        </div>
    );
}