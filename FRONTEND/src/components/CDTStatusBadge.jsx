const CDTStatusBadge = ({ status }) => {
    const statusConfig = {
        draft: {
            label: 'Borrador',
            icon: '📝',
            className: 'status-draft'
        },
        pending: {
            label: 'Pendiente',
            icon: '⏳',
            className: 'status-pending'
        },
        active: {
            label: 'Activo',
            icon: '✅',
            className: 'status-active'
        },
        rejected: {
            label: 'Rechazado',
            icon: '❌',
            className: 'status-rejected'
        },
        completed: {
            label: 'Completado',
            icon: '🎉',
            className: 'status-completed'
        },
        cancelled: {
            label: 'Cancelado',
            icon: '🚫',
            className: 'status-cancelled'
        }
    };

    const config = statusConfig[status] || {
        label: status,
        icon: '❓',
        className: 'status-unknown'
    };

    return (
        <span className={`cdt-status-badge ${config.className}`}>
            <span className="status-icon">{config.icon}</span>
            <span className="status-label">{config.label}</span>
        </span>
    );
};

export default CDTStatusBadge;
