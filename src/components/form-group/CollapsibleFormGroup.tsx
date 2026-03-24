import { useState } from 'react';
import './CollapsibleFormGroup.scss';
import Label from "../label/Label";

type Props = {
    label: string;
    small?: string;
    initialCollapsed?: boolean;
    children?: React.ReactNode;
}

export default function CollapsibleFormGroup({ label, small, children, initialCollapsed = false }: Props) {
    const [isOpen, setIsOpen] = useState(!initialCollapsed);

    return (
        <div className={`form-group collapsible ${isOpen ? 'is-open' : 'is-closed'}`}>
            <div className="form-group-header" onClick={() => setIsOpen(!isOpen)} role="button">
                <div className="label-container">
                    <Label>
                        {label}
                        {small && (
                            <>
                                <br />
                                <small>{small}</small>
                            </>
                        )}
                    </Label>
                </div>
                <span className={`chevron ${isOpen ? 'up' : 'down'}`}>▼</span>
            </div>

            {isOpen && (
                <div className="form-group-content">
                    {children}
                </div>
            )}
        </div>
    );
}