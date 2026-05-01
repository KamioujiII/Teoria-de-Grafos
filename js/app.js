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

/* ──────────────────────────────────────────────
   ActorDropdown — dropdown com busca integrada
────────────────────────────────────────────── */
class ActorDropdown {
    constructor(wrapperId, placeholder = 'Selecione um ator...') {
        this.wrapper     = document.getElementById(wrapperId);
        this.actors      = [];
        this.selected    = '';
        this._build(placeholder);
    }

    _build(placeholder) {
        this.wrapper.innerHTML = `
            <input class="dd-input" readonly placeholder="${placeholder}" />
            <div class="dd-panel">
                <div class="dd-search">
                    <input type="text" placeholder="Buscar ator..." />
                </div>
                <div class="dd-list"></div>
            </div>
        `;

        this.trigger = this.wrapper.querySelector('.dd-input');
        this.panel   = this.wrapper.querySelector('.dd-panel');
        this.search  = this.wrapper.querySelector('.dd-search input');
        this.list    = this.wrapper.querySelector('.dd-list');

        this.trigger.addEventListener('click', () => {
            this.panel.classList.contains('open') ? this._close() : this._open();
        });

        this.search.addEventListener('input', () => this._render(this.search.value));

        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) this._close();
        });
    }

    setActors(actors) {
        this.actors = actors;
        this._render();
    }

    _render(filter = '') {
        const term     = filter.toLowerCase();
        const filtered = this.actors.filter(a => a.toLowerCase().includes(term));

        this.list.innerHTML = '';

        if (!filtered.length) {
            this.list.innerHTML = '<div class="dd-empty">Nenhum ator encontrado</div>';
            return;
        }

        filtered.forEach(a => {
            const div = document.createElement('div');
            div.className = 'dd-item' + (a === this.selected ? ' active' : '');
            div.textContent = a;
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.selected      = a;
                this.trigger.value = a;
                this._close();
            });
            this.list.appendChild(div);
        });
    }

    _open() {
        this.panel.classList.add('open');
        this.trigger.classList.add('open');
        this.search.value = '';
        this._render();
        setTimeout(() => this.search.focus(), 0);
    }

    _close() {
        this.panel.classList.remove('open');
        this.trigger.classList.remove('open');
    }

    getValue() {
        return this.trigger.value;
    }

    clear() {
        this.selected      = '';
        this.trigger.value = '';
    }
}

/* ──────────────────────────────────────────────
   ActorUI — gerencia os dois dropdowns e resultados
────────────────────────────────────────────── */
class ActorUI {
    constructor() {
        this.dd1 = new ActorDropdown('dropdown1', 'Selecione o ator 1...');
        this.dd2 = new ActorDropdown('dropdown2', 'Selecione o ator 2...');
    }

    setActors(actors) {
        this.dd1.setActors(actors);
        this.dd2.setActors(actors);
    }

    getActor1() { return this.dd1.getValue(); }
    getActor2() { return this.dd2.getValue(); }

    showShortestPath(data) {
        const resultDiv = document.getElementById('busca1-result');
        resultDiv.style.color = '#1a1a1a';
        resultDiv.textContent =
            `Distância ${data.distance} | Caminho: ${data.path.join(' → ')}`;
    }

    showLevels(data) {
        const resultDiv = document.getElementById('busca2-result');

        resultDiv.innerHTML = `
            <h3>Resultados</h3>
            <p><strong id="contador">0</strong> caminhos encontrados</p>
            <div id="lista"></div>
        `;

        if (!Array.isArray(data)) {
            resultDiv.innerHTML += `<p>${data.message}</p>`;
            return;
        }

        const lista    = document.getElementById('lista');
        const contador = document.getElementById('contador');
        let i = 0;

        function renderChunk() {
            let count = 0;
            while (i < data.length && count < 50) {
                const item = data[i];
                const p    = document.createElement('p');
                p.innerHTML = `Distância: ${item.distance}<br>Caminho: ${item.path.join(' → ')}`;
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

    clearSearch1() {
        const el = document.getElementById('busca1-result');
        el.textContent  = '';
        el.style.color  = '#1a1a1a';
    }

    clearSearch2() {
        document.getElementById('busca2-result').innerHTML = '';
    }

    showErrorMessage(message, elementId) {
        const el       = document.getElementById(elementId);
        el.style.color = 'red';
        el.textContent = message;
    }

    showLevelsError(message) {
        document.getElementById('busca2-result').innerHTML =
            `<p style="color:red;">${message}</p>`;
    }
}

/* ──────────────────────────────────────────────
   Inicialização
────────────────────────────────────────────── */
const ui = new ActorUI();

ApiService.getActors()
    .then(actors => ui.setActors(actors))
    .catch(err => console.error('Erro ao carregar atores:', err));

async function runBusca1() {
    const actor1 = ui.getActor1();
    const actor2 = ui.getActor2();

    if (!actor1 || !actor2) return alert('Selecione dois atores.');

    ui.clearSearch1();

    try {
        const data = await ApiService.getShortestPath(actor1, actor2);
        ui.showShortestPath(data);
    } catch (err) {
        ui.showErrorMessage(err.message || 'Erro na busca', 'busca1-result');
    }
}

async function runBusca2() {
    const actor1 = ui.getActor1();
    const actor2 = ui.getActor2();

    if (!actor1 || !actor2) return alert('Selecione dois atores.');

    ui.clearSearch2();

    document.getElementById('busca2-result').innerHTML = `
        <h3>Busca em andamento...</h3>
        <p>Calculando caminhos, aguarde.</p>
    `;

    try {
        const data = await ApiService.getLevels(actor1, actor2, 8);
        ui.showLevels(data);
    } catch (err) {
        ui.showLevelsError(err.message || 'Erro na busca');
    }
}

document.getElementById('run-search1').addEventListener('click', runBusca1);
document.getElementById('run-search2').addEventListener('click', runBusca2);