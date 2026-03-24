import {useState} from 'react'
import './NumberInput.scss'

type Props = {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    placeholder?: string;
    disabled?: boolean;
}

export default function NumberInput({ label, value, onChange, min, max, placeholder, disabled }: Props) {
	const [inputValue, setInputValue] = useState<string>(value.toString());

    // 1. Sync local string ONLY if the numeric prop changes elsewhere
    // We do this by checking if the current string's numeric value matches the prop
    if (parseFloat(inputValue) !== value && !isNaN(parseFloat(inputValue))) {
        // This is a "derived state" pattern that React handles better than useEffect
        setInputValue(value.toString());
    }

    // 2. Calculate validity on every render
    const parsed = parseFloat(inputValue);
    const isNumeric = !isNaN(parsed) && isFinite(parsed);
    const isWithinRange = (min === undefined || parsed >= min) &&
                          (max === undefined || parsed <= max);

    // We don't mark "-" or "" as invalid while the user is mid-thought
    const isMidTyping = inputValue === "" || inputValue === "-";
    const isValid = isMidTyping || (isNumeric && isWithinRange);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const str = e.target.value;
        setInputValue(str);

        const nextParsed = parseFloat(str);
        if (!isNaN(nextParsed) && (min === undefined || nextParsed >= min) && (max === undefined || nextParsed <= max)) {
            onChange(nextParsed);
        }
    };
    return (
        <div className={`number-input-container ${!isValid ? 'has-error' : ''}`}>
            <label className="input-label">
                {label}
                {(!isValid && min !== undefined) && <span> (Min: {min})</span>}
            </label>
            <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleChange}
                placeholder={placeholder}
                className="number-input-field"
                disabled={disabled}
            />
        </div>
    );
}