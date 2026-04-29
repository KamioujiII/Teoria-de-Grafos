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
        if (!response.ok) throw new Error(data.message || 'Erro na busca');
        return data;
    }

    static async getLevels(startActor, endActor, maxLevel = 8) {
        const response = await fetch(`${this.baseUrl}/levels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startActor, endActor, maxLevel })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro na busca');
        return data;
    }
}

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
        resultDiv.textContent =
            `Busca 1: Distância ${data.distance} | Caminho: ${data.path.join(' → ')}`;
    }

    showLevels(data) {
        const resultDiv = document.getElementById('busca2-result');

        resultDiv.innerHTML = `
            <h3>Busca 2</h3>
            <p><strong id="contador">0</strong> caminhos encontrados</p>
            <div id="lista"></div>
        `;

        if (!Array.isArray(data)) {
            resultDiv.innerHTML += `<p>${data.message}</p>`;
            return;
        }

        const lista = document.getElementById('lista');
        const contador = document.getElementById('contador');

        let i = 0;

        function renderChunk() {
            let count = 0;

            while (i < data.length && count < 50) {
                const item = data[i];

                const p = document.createElement('p');
                p.innerHTML = `
                    Distância: ${item.distance}<br>
                    Caminho: ${item.path.join(' → ')}
                `;

                lista.appendChild(p);
                lista.appendChild(document.createElement('hr'));

                i++;
                count++;
            }

            contador.textContent = i;

            if (i < data.length) {
                setTimeout(renderChunk, 0);
            } else {
                const done = document.createElement('p');
                done.innerHTML = `<strong>✅ Total: ${data.length}</strong>`;
                lista.appendChild(done);
            }
        }

        renderChunk();
    }

    clearResults() {
        document.getElementById('busca1-result').textContent = '';
        document.getElementById('busca2-result').innerHTML = '';
    }
}

const ui = new ActorUI();

ApiService.getActors()
    .then(actors => ui.setActors(actors))
    .catch(err => console.error('Erro ao carregar atores:', err));


document.getElementById('run-both-searches').addEventListener('click', async () => {
    const actor1 = document.getElementById('actor1').value;
    const actor2 = document.getElementById('actor2').value;

    if (!actor1 || !actor2) return alert('Selecione dois atores.');

    ui.clearResults();

    try {
        const shortestData = await ApiService.getShortestPath(actor1, actor2);
        ui.showShortestPath(shortestData, actor1, actor2);

        const resultDiv = document.getElementById('busca2-result');
        resultDiv.innerHTML = `\n            <h3>Busca 2</h3>\n            <p>Calculando caminhos...</p>\n        `;

        const data = await ApiService.getLevels(actor1, actor2, 8);
        ui.showLevels(data);
    } catch (err) {
        const message = err.message || 'Erro na busca';
        ui.showErrorMessage(message, 'busca1-result');
        ui.showLevelsError(message);
    }
});

document.getElementById('search-actor1')
    .addEventListener('input', (e) => ui.filterActors(e.target.value, 'actor1'));

document.getElementById('search-actor2')
    .addEventListener('input', (e) => ui.filterActors(e.target.value, 'actor2'));
