import json
from collections import defaultdict, deque

# Load data
with open('data/latest_movies.json', 'r', encoding='utf-8') as f:
    movies = json.load(f)

# Function to create the graph
def build_graph(movies):
    graph = defaultdict(list)
    for movie in movies:
        movie_id = str(movie['id'])
        for actor in movie['cast']:
            graph[movie_id].append(actor)
            graph[actor].append(movie_id)
    return graph

# Build graph: undirected, nodes are movie ids (str) and actor names
graph = build_graph(movies)

# Function to find shortest path using BFS
def bfs_shortest_path(graph, start, goal):
    queue = deque([(start, [start])])
    visited = set([start])
    while queue:
        current, path = queue.popleft()
        if current == goal:
            return path
        for neighbor in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return None

# Function to get all paths up to level 8
def bfs_levels(graph, start, max_level=8):
    levels = defaultdict(list)
    visited = set()
    queue = deque([(start, [start], 0)])
    visited.add(start)
    while queue:
        current, path, level = queue.popleft()
        if level > max_level:
            continue
        levels[level].append((current, path))
        if level < max_level:
            for neighbor in graph[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor], level + 1))
    return levels

# Select two actors ordered
actors = sorted(set(actor for movie in movies for actor in movie['cast']))
print("Atores ordenados:", actors)

# Choose two actors for busca 1
actor1 = "Marlon Brando"
actor2 = "Al Pacino"

# Busca 1: shortest distance between actor1 and actor2
path = bfs_shortest_path(graph, actor1, actor2)
if path:
    distance = len(path) - 1
    print(f"Busca 1: A distância mais curta entre {actor1} e {actor2} é {distance}. Caminho: {' -> '.join(path)}")
else:
    print(f"Busca 1: Não há caminho entre {actor1} e {actor2}")

# Busca 2: all results up to level 8 from actor1
levels = bfs_levels(graph, actor1, 8)
print(f"Busca 2: Resultados até o nível 8 a partir de {actor1}:")
for level in range(9):
    if level in levels:
        print(f"Nível {level}:")
        for node, path in levels[level]:
            if node != actor1 or level == 0:  # avoid printing start at level 0 multiple times
                print(f"  {node}: {' -> '.join(path)}")
    else:
        print(f"Nível {level}: Nenhum")