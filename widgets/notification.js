

export function showNotification(message, duration = 2000, type = 'success', reload = false) {
    const notification = window.document.getElementById('notification');
    notification.textContent = message;

    // Reset and apply base Tailwind classes
    notification.className = 'fixed top-5 right-5 text-white p-[15px] rounded-[5px] z-[1000] transition-opacity duration-150 opacity-0';

    // Apply type-specific colors
    if (type === 'success') {
        notification.classList.add('bg-[#4caf50]');
    } else if (type === 'restore' || type === 'error') {
        notification.classList.add('bg-[#f44336]');
    }

    notification.classList.remove('hidden');
    // Force a reflow for transition
    void notification.offsetWidth;
    notification.classList.add('opacity-100');

    setTimeout(() => {
        notification.classList.remove('opacity-100');
        setTimeout(() => {
            notification.classList.add('hidden');
            if (reload) {
                location.reload();
            }
        }, 500); // Wait for fade out before reloading
    }, duration);
}