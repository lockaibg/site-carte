document.addEventListener('DOMContentLoaded', () => {
    const userCode = localStorage.getItem('userCode');

    if (!userCode) {
        alert("Vous devez être connecté pour accéder au site.");
        window.location.href = "../connexion/connexion.html";
        return;
    }

    const currentUrl = new URL(window.location.href);

    if (!currentUrl.searchParams.has('code')) {
        currentUrl.searchParams.set('code', userCode);
        window.location.replace(currentUrl.toString());
    }
});
