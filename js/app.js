// Load actors
let actors = [];

fetch('http://localhost:3000/actors')
    .then(response => response.json())
    .then(data => {
        actors = data.actors;
        populateActors();
    })
    .catch(error => console.error('Error loading actors:', error));

function populateActors() {
    const actor1Select = document.getElementById('actor1');
    const actor2Select = document.getElementById('actor2');
    const startActorSelect = document.getElementById('start-actor');
    actors.forEach(actor => {
        const option1 = new Option(actor, actor);
        const option2 = new Option(actor, actor);
        const optionStart = new Option(actor, actor);
        actor1Select.appendChild(option1);
        actor2Select.appendChild(option2);
        startActorSelect.appendChild(optionStart);
    });
}

function bfsShortestPath(start, goal) {
    const queue = [[start, [start]]];
    const visited = new Set([start]);
    while (queue.length > 0) {
        const [current, path] = queue.shift();
        if (current === goal) return path;
        for (const neighbor of graph.get(current) || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([neighbor, [...path, neighbor]]);
            }
        }
    }
    return null;
}

function bfsLevels(start, maxLevel = 8) {
    const levels = new Map();
    const visited = new Set();
    const queue = [[start, [start], 0]];
    visited.add(start);
    while (queue.length > 0) {
        const [current, path, level] = queue.shift();
        if (level > maxLevel) continue;
        if (!levels.has(level)) levels.set(level, []);
        levels.get(level).push([current, path]);
        if (level < maxLevel) {
            for (const neighbor of graph.get(current) || []) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, [...path, neighbor], level + 1]);
                }
            }
        }
    }
    return levels;
}

document.getElementById('select-actors').addEventListener('click', () => {
    const actor1 = document.getElementById('actor1').value;
    const actor2 = document.getElementById('actor2').value;
    if (!actor1 || !actor2) {
        alert('Selecione dois atores.');
        return;
    }
    fetch('http://localhost:3000/shortest-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor1, actor2 })
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('busca1-result');
        if (data.distance !== undefined) {
            resultDiv.textContent = `Busca 1: A distância mais curta entre ${actor1} e ${actor2} é ${data.distance}. Caminho: ${data.path.join(' -> ')}`;
        } else {
            resultDiv.textContent = `Busca 1: Não há caminho entre ${actor1} e ${actor2}`;
        }
    })
    .catch(error => console.error('Error:', error));
});

document.getElementById('run-busca2').addEventListener('click', () => {
    const startActor = document.getElementById('start-actor').value;
    if (!startActor) {
        alert('Selecione um ator inicial.');
        return;
    }
    fetch('http://localhost:3000/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startActor, maxLevel: 8 })
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('busca2-result');
        resultDiv.innerHTML = `<h3>Busca 2: Resultados até o nível 8 a partir de ${startActor}:</h3>`;
        for (const level in data) {
            resultDiv.innerHTML += `<h4>Nível ${level}:</h4>`;
            if (data[level].length === 0) {
                resultDiv.innerHTML += '<p>Nenhum</p>';
            } else {
                data[level].forEach(item => {
                    resultDiv.innerHTML += `<p>${item.node}: ${item.path.join(' -> ')}</p>`;
                });
            }
        }
    })
    .catch(error => console.error('Error:', error));
});