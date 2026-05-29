// DOM
const pokemonInput = document.getElementById('pokemon-input');
const searchBtn = document.getElementById('search-btn');
const resultContainer = document.getElementById('result-container');
const errorContainer = document.getElementById('error-container');
const historyList = document.getElementById('history-list');

// URL de la API
const API_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';

// Keys para localStorage
const STORAGE_KEYS = {
    RATINGS: 'pokemonRatings',
    HISTORY: 'searchHistory'
};

// Event listeners
searchBtn.addEventListener('click', buscarPokemon);
pokemonInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        buscarPokemon();
    }
});

// Cargar historial al iniciar
document.addEventListener('DOMContentLoaded', () => {
    mostrarHistorial();
});

// Función principal para buscar Pokémon
async function buscarPokemon() {
    const pokemonNameOrId = pokemonInput.value.trim().toLowerCase();
    
    if (!pokemonNameOrId) {
        mostrarError('Por favor, ingresa un nombre o número de Pokémon');
        return;
    }

    guardarEnHistorial(pokemonNameOrId);

    try {
        const response = await fetch(`${API_BASE_URL}${pokemonNameOrId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Pokémon no encontrado. Intente nuevamente.');
            } else {
                throw new Error('Error en la consulta. Por favor, intente más tarde.');
            }
        }

        const pokemonData = await response.json();
        mostrarInfoPokemon(pokemonData);
        
    } catch (error) {
        mostrarError(error.message);
    }
}

// Función para guardar en historial
function guardarEnHistorial(terminoBusqueda) {
    let historial = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];

        //Para agregar el dato en el historial
        historial.unshift(terminoBusqueda)

        // Mantener solo los últimos 10
        if (historial.length > 10) {
            historial = historial.slice(0, 10);
        }
        
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historial));
        mostrarHistorial();
}

// Función para mostrar el historial
function mostrarHistorial() {
    const historial = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
    
    if (historial.length === 0) {
        historyList.innerHTML = '<p class="no-history">No hay búsquedas recientes</p>';
        return;
    }
    
    let htmlHistorial = '';
    for (let i = 0; i < historial.length; i++) {
        htmlHistorial = htmlHistorial + '<span class="history-item" onclick="buscarDelHistorial(\'' + historial[i] + '\')">' + historial[i] + '</span>';
    }
    
    historyList.innerHTML = htmlHistorial;
}

// Función para buscar desde el historial
window.buscarDelHistorial = function(term) {
    pokemonInput.value = term;
    buscarPokemon();
}

// Función para mostrar la información del Pokémon
function mostrarInfoPokemon(pokemon) {
    errorContainer.classList.add('hidden');
    resultContainer.innerHTML = '';
    
    const tipos = pokemon.types.map(typeInfo => 
        `<span class="type-badge type-${typeInfo.type.name}">${typeInfo.type.name}</span>`
    ).join('');

    const puntuacionUsuario = obtenerPuntuacionPokemon(pokemon.name);
    const estrellas = generarEstrellas(pokemon.name, puntuacionUsuario);

    const pokemonHTML = `
        <div class="pokemon-card">
            <div class="pokemon-header">
                <h2 class="pokemon-name">${pokemon.name} #${pokemon.id.toString().padStart(3, '0')}</h2>
            </div>
            
            <div class="pokemon-image">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png" alt="${pokemon.name}">
            </div>
            
            <div class="pokemon-info">
                <div class="info-item">
                    <div class="info-label">Tipo(s)</div>
                    <div class="info-value pokemon-types">
                        ${tipos}
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Peso</div>
                    <div class="info-value">${(pokemon.weight / 10).toFixed(1)} kg</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Altura</div>
                    <div class="info-value">${(pokemon.height / 10).toFixed(1)} m</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Experiencia base</div>
                    <div class="info-value">${pokemon.base_experience || 'N/A'}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Habilidades</div>
                    <div class="info-value">${pokemon.abilities.map(ability => 
                        ability.ability.name.replace('-', ' ')
                    ).join(', ')}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Estadísticas base</div>
                    <div class="info-value">HP: ${pokemon.stats[0].base_stat} | ATK: ${pokemon.stats[1].base_stat} | DEF: ${pokemon.stats[2].base_stat}</div>
                </div>
            </div>
            
            <div class="rating-container">
                <div class="stars-container" id="stars-container-${pokemon.name}">
                    ${estrellas}
                </div>
                
                <div class="rating-info">
                    ${puntuacionUsuario ? 
                        `<p class="user-rating-message">Tu puntuación: ${puntuacionUsuario} ⭐</p>` : 
                        '<p>¡Haz clic en las estrellas para puntuar!</p>'}
                </div>
            </div>
        </div>
    `;

    resultContainer.innerHTML = pokemonHTML;
    resultContainer.classList.remove('hidden');
    
    agregarListenersEstrellas(pokemon.name);
}

// Función para generar estrellas
function generarEstrellas(nombrePokemon, puntuacionUsuario) {
    let estrellas = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= puntuacionUsuario) {
            estrellas = estrellas + '<span class="star active" data-rating="' + i + '" data-pokemon-name="' + nombrePokemon + '">★</span>';
        } else {
            estrellas = estrellas + '<span class="star" data-rating="' + i + '" data-pokemon-name="' + nombrePokemon + '">★</span>';
        }
    }
    
    return estrellas;
}

// Función para agregar listeners a las estrellas (simplificada)
function agregarListenersEstrellas(nombrePokemon) {
    const contenedorEstrellas = document.getElementById('stars-container-' + nombrePokemon);
    const estrellas = contenedorEstrellas.getElementsByClassName('star');
    
    for (let i = 0; i < estrellas.length; i++) {
        const estrella = estrellas[i];
        
        estrella.onclick = function(e) {
            const rating = e.target.getAttribute('data-rating');
            const puntuacion = parseInt(rating);
            guardarPuntuacion(nombrePokemon, puntuacion);
        };
        
        estrella.onmouseover = function(e) {
            const rating = e.target.getAttribute('data-rating');
            const puntuacion = parseInt(rating);
            
            for (let j = 0; j < estrellas.length; j++) {
                if (j < puntuacion) {
                    estrellas[j].style.color = '#ffd700';
                    estrellas[j].style.transform = 'scale(1.1)';
                } else {
                    estrellas[j].style.color = 'rgba(255, 255, 255, 0.5)';
                    estrellas[j].style.transform = 'scale(1)';
                }
            }
        };
        
        estrella.onmouseout = function() {
            const puntuacionUsuario = obtenerPuntuacionPokemon(nombrePokemon);
            
            for (let j = 0; j < estrellas.length; j++) {
                if (j < puntuacionUsuario) {
                    estrellas[j].style.color = '#ffd700';
                } else {
                    estrellas[j].style.color = 'rgba(255, 255, 255, 0.5)';
                }
                estrellas[j].style.transform = 'scale(1)';
            }
        };
    }
}

// Función para guardar puntuación
function guardarPuntuacion(nombrePokemon, puntuacion) {
    let todasLasPuntuaciones = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS)) || {};
    todasLasPuntuaciones[nombrePokemon] = puntuacion;
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(todasLasPuntuaciones));
    buscarPokemon();
}

// Función para obtener puntuación de un Pokémon
function obtenerPuntuacionPokemon(nombrePokemon) {
    const todasLasPuntuaciones = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS)) || {};
    return todasLasPuntuaciones[nombrePokemon] || 0;
}

// Función para mostrar errores
function mostrarError(mensaje) {
    resultContainer.classList.add('hidden');
    errorContainer.innerHTML = `<div class="error-message">❌ ${mensaje}</div>`;
    errorContainer.classList.remove('hidden');
}
