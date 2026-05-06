const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

let movies = [];
try {
    const data = fs.readFileSync('data/latest_movies.json', 'utf8');
    movies = JSON.parse(data);
} catch (error) {
    console.error('Erro: data/latest_movies.json não encontrado.');
    process.exit(1);
}

const movieMap = new Map();
movies.forEach(movie => {
    movieMap.set(movie.id.toString(), movie.title);
});

class FastQueue {
    constructor() {
        this.items = {};
        this.head = 0;
        this.tail = 0;
    }
    enqueue(item) { this.items[this.tail++] = item; }
    dequeue() {
        const item = this.items[this.head];
        delete this.items[this.head++];
        return item;
    }
    get length() { return this.tail - this.head; }
}

class Graph {
    constructor() {
        this.adjList = new Map();
    }

    addVertex(node){
        if (!this.adjList.has(node)){
            this.adjList.set(node, []);
        }
    }

    addEdge(a, b) {
        this.addVertex(a);
        this.addVertex(b);
        this.adjList.get(a).push(b);
    }

    getNeighbors(node) {
         return this.adjList.get(node) || []; 
        }
    has(node) {
         return this.adjList.has(node); 
        }
}

const graph = (() => {
    const g = new Graph();
    movies.forEach(m => {
        const movieId = m.id.toString();
        m.cast.forEach(actor => {
            g.addEdge(movieId, actor);
            g.addEdge(actor, movieId);
        });
    });
    return g;
})();

class GraphSearch {
    static bfsShortestPath(graph, start, goal) {
        if (!graph.has(start) || !graph.has(goal)) return null;
        if (start === goal) return [start];
        const queue = new FastQueue();
        const visited = new Map();
        queue.enqueue(start);
        visited.set(start, null);
        while (queue.length > 0) {
            const current = queue.dequeue();
            if (current === goal) {
                const path = [];
                let curr = goal;
                while (curr !== null) {
                    path.push(curr);
                    curr = visited.get(curr);
                }
                return path.reverse();
            }
            for (const neighbor of graph.getNeighbors(current)) {
                if (!visited.has(neighbor)) {
                    visited.set(neighbor, current);
                    queue.enqueue(neighbor);
                }
            }
        }
        return null;
    }

    static bfsAllPaths(graph, start, goal, maxLevel) {
        const results = [];
        const seen = new Set();
        const queue = new FastQueue();

       
        queue.enqueue({ node: start, parent: null, depth: 0 });

        while (queue.length > 0) {
            const entry = queue.dequeue();
            const { node, depth } = entry;

            if (depth > maxLevel) continue;

            if (node === goal) {
        
                const path = [];
                let cur = entry;
                while (cur !== null) {
                    path.push(cur.node);
                    cur = cur.parent;
                }
                path.reverse();

                const key = path.join('|');
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push(path);
                }
                continue;
            }

            const visited = new Set();
            let cur = entry;
            while (cur !== null) {
                visited.add(cur.node);
                cur = cur.parent;
            }

            for (const neighbor of graph.getNeighbors(node)) {
                if (!visited.has(neighbor)) {
                    queue.enqueue({ node: neighbor, parent: entry, depth: depth + 1 });
                }
            }
        }
        return results;
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/shortest-path', (req, res) => {
    const { actor1, actor2 } = req.body;
    const path = GraphSearch.bfsShortestPath(graph, actor1, actor2);
    if (path) {
        res.json({ distance: path.length - 1, path: path.map(n => movieMap.get(n) || n) });
    } else {
        res.status(404).json({ message: "Não há relação entre atores/atrizes" });
    }
});

app.post('/levels', (req, res) => {
    const { startActor, endActor, maxLevel = 8 } = req.body;
    const shortest = GraphSearch.bfsShortestPath(graph, startActor, endActor);

    if (!shortest) {
        return res.status(404).json({ message: "Não há relação entre atores/atrizes" });
    }

    const realDist = shortest.length - 1;
    if (realDist > maxLevel) {
        return res.status(400).json({ message: `Não foi possível encontrar o caminho mínimo 8. A distância real é ${realDist}.` });
    }

    const paths = GraphSearch.bfsAllPaths(graph, startActor, endActor, maxLevel);
    res.json(paths.map(p => ({ distance: p.length - 1, path: p.map(n => movieMap.get(n) || n) })));
});

app.get('/actors', (req, res) => {
    const actors = [...new Set(movies.flatMap(m => m.cast))].sort();
    res.json({ actors });
});

app.listen(PORT, () => console.log(`Servidor em http://localhost:${PORT}`));