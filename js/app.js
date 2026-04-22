// =========================
// 📌 API SERVICE
// =========================
class ApiService {
    static baseUrl = 'http://localhost:3000';

    static async getActors() {
        const response = await fetch(`${this.baseUrl}/actors`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao carregar atores');
        return data.actors;
    }

    static async getShortestPath(actor1, actor2) {
        const response = await fetch(`${this.baseUrl}/shortest-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actor1, actor2 })
        });

        const data = await response.json();
        if (!response.ok) {
            // Captura a mensagem "Não há relação entre atores/atrizes" enviada pelo servidor
            throw new Error(data.message || 'Erro na busca');
        }
        return data;
    }

    static async getLevels(startActor, endActor, maxLevel = 8) {
        const response = await fetch(`${this.baseUrl}/levels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startActor, endActor, maxLevel })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro na busca');
        }
        return data;
    }
}

// =========================
// 📌 UI SERVICE
// =========================
class ActorUI {
    constructor() {
        this.actors = [];
    }

    setActors(actors) {
        this.actors = actors;
        this.populateActors();
    }

    populateActors(list = this.actors) {
        const actor1Select = document.getElementById('actor1');
        const actor2Select = document.getElementById('actor2');

        actor1Select.innerHTML = '';
        actor2Select.innerHTML = '';

        list.forEach(actor => {
            actor1Select.appendChild(new Option(actor, actor));
            actor2Select.appendChild(new Option(actor, actor));
        });
    }

    filterActors(term, selectId) {
        const filtered = this.actors.filter(actor =>
            actor.toLowerCase().includes(term.toLowerCase())
        );

        const select = document.getElementById(selectId);
        select.innerHTML = '';

        filtered.forEach(actor => {
            select.appendChild(new Option(actor, actor));
        });
    }

    showShortestPath(data, actor1, actor2) {
        const resultDiv = document.getElementById('busca1-result');
        resultDiv.style.color = "black";
        resultDiv.textContent = `Busca 1: A distância mais curta entre ${actor1} e ${actor2} é ${data.distance}. Caminho: ${data.path.join(' -> ')}`;
    }

    showLevels(data) {
        const resultDiv = document.getElementById('busca2-result');
        resultDiv.innerHTML = `<h3>Busca 2:</h3>`;

        if (!Array.isArray(data)) {
            resultDiv.innerHTML += `<p>${data.message || 'Erro na busca'}</p>`;
            return;
        }

        data.forEach(item => {
            resultDiv.innerHTML += `
                <p>
                    Distância: ${item.distance}<br>
                    Caminho: ${item.path.join(' → ')}
                </p>
                <hr>
            `;
        });
    }

    showErrorMessage(msg, elementId) {
        const resultDiv = document.getElementById(elementId);
        resultDiv.style.color = "red";
        resultDiv.textContent = msg;
    }
}

// =========================
// 📌 INIT & EVENTOS
// =========================
const ui = new ActorUI();

ApiService.getActors()
    .then(actors => ui.setActors(actors))
    .catch(err => console.error('Erro ao carregar atores:', err));

document.getElementById('select-actors').addEventListener('click', async () => {
    const actor1 = document.getElementById('actor1').value;
    const actor2 = document.getElementById('actor2').value;

    if (!actor1 || !actor2) return alert('Selecione dois atores.');

    try {
        const data = await ApiService.getShortestPath(actor1, actor2);
        ui.showShortestPath(data, actor1, actor2);
    } catch (err) {
        ui.showErrorMessage(err.message, 'busca1-result');
    }
});

document.getElementById('run-busca2').addEventListener('click', async () => {
    const startActor = document.getElementById('actor1').value;
    const endActor = document.getElementById('actor2').value;

    if (!startActor || !endActor) return alert('Selecione dois atores.');

    try {
        const data = await ApiService.getLevels(startActor, endActor, 8);
        ui.showLevels(data);
    } catch (err) {
        document.getElementById('busca2-result').innerHTML = `<p style="color: red;">${err.message}</p>`;
    }
});

document.getElementById('search-actor1').addEventListener('input', (e) => ui.filterActors(e.target.value, 'actor1'));
document.getElementById('search-actor2').addEventListener('input', (e) => ui.filterActors(e.target.value, 'actor2'));