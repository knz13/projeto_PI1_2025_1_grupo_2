async function fetchDados() {
    const response = await fetch('http://localhost:3325/controllers-data');
    const json = await response.json();

    if (response.ok) {
        // Supondo que o controller se chama "dados"
        return json.dados;
    } else {
        console.error('Erro:', json.error);
        return null;
    }
}

export const launchData = await fetchDados();