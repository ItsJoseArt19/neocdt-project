import { useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    return (
        <div className="toast-container">
            <div className={`toast toast-${type}`}>
                <div className="toast-icon">{icons[type]}</div>
                <div className="toast-message">{message}</div>
                <button className="toast-close" onClick={onClose}>×</button>
            </div>
        </div>
    );
};

export default Toast;
