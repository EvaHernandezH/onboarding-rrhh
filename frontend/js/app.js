const API_URL = 'http://localhost:3000/api';

// Elementos del DOM
const modalForm = document.getElementById('modalForm');
const candidatoForm = document.getElementById('candidatoForm');
const modalTitle = document.getElementById('modalTitle');
const tableBody = document.getElementById('candidatosBody');
const filterEstado = document.getElementById('filter-estado');

// KPIs
const kpiConvocatoria = document.getElementById('kpi-convocatoria');
const kpiCapacitacion = document.getElementById('kpi-capacitacion');
const kpiContratado = document.getElementById('kpi-contratado');
const kpiRechazado = document.getElementById('kpi-rechazado');

let candidatosActuales = [];
let chartEstado = null;
let chartFunnel = null;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadCandidatos();
    
    // Setear fecha actual por defecto en el form
    document.getElementById('fecha_estado').valueAsDate = new Date();
});

// Función para abrir el modal (Nuevo o Editar)
function openModal(candidato = null) {
    if (candidato) {
        modalTitle.textContent = 'Editar Candidato';
        document.getElementById('candidatoId').value = candidato.id;
        document.getElementById('datos_postulante').value = candidato.datos_postulante;
        document.getElementById('fuente').value = candidato.fuente;
        document.getElementById('sede').value = candidato.sede;
        document.getElementById('condicion').value = candidato.condicion;
        document.getElementById('prueba_manejo').value = candidato.prueba_manejo;
        document.getElementById('estado').value = candidato.estado;
        updateSubestados(); // Actualizar opciones dependientes
        document.getElementById('sub_estado').value = candidato.sub_estado;
        document.getElementById('responsable').value = candidato.responsable || '';
        document.getElementById('fecha_estado').value = candidato.fecha_estado || new Date().toISOString().split('T')[0];
        document.getElementById('observacion').value = candidato.observacion || '';
    } else {
        modalTitle.textContent = 'Nuevo Candidato';
        candidatoForm.reset();
        document.getElementById('candidatoId').value = '';
        document.getElementById('fecha_estado').valueAsDate = new Date();
        updateSubestados();
    }
    modalForm.classList.add('active');
}

function closeModal() {
    modalForm.classList.remove('active');
}

// Actualizar opciones de sub-estado según el estado principal
function updateSubestados() {
    const estado = document.getElementById('estado').value;
    const subEstadoSelect = document.getElementById('sub_estado');
    
    let opciones = [];
    if (estado === 'CONVOCATORIA') {
        opciones = ['Pendiente', 'No le gusta propuesta', 'Temas de religión', 'Reprogramó'];
    } else if (estado.includes('CAPACITACION')) {
        opciones = ['Pendiente', 'Asistió', 'No asistió'];
    } else if (estado === 'CONTRATADO') {
        opciones = ['Firmó contrato', 'Pendiente de firma'];
    } else if (estado === 'RECHAZADO') {
        opciones = ['No cumple perfil', 'Prueba técnica desaprobada', 'Desistió'];
    } else {
        opciones = ['Pendiente'];
    }

    subEstadoSelect.innerHTML = opciones.map(op => `<option value="${op}">${op}</option>`).join('');
}

// Cargar candidatos desde la API
async function loadCandidatos() {
    try {
        const response = await fetch(`${API_URL}/candidatos`);
        const result = await response.json();
        candidatosActuales = result.data;
        renderTable();
        updateKPIs();
    } catch (error) {
        console.error('Error cargando candidatos:', error);
    }
}

// Renderizar tabla
function renderTable() {
    const filterValue = filterEstado.value;
    const filtrados = filterValue 
        ? candidatosActuales.filter(c => c.estado === filterValue)
        : candidatosActuales;

    tableBody.innerHTML = filtrados.map(c => {
        let badgeClass = 'badge ';
        if(c.estado === 'CONVOCATORIA') badgeClass += 'estado-convocatoria';
        else if(c.estado.includes('CAPACITACION')) badgeClass += 'estado-capacitacion';
        else if(c.estado === 'CONTRATADO') badgeClass += 'estado-contratado';
        else if(c.estado === 'RECHAZADO') badgeClass += 'estado-rechazado';

        return `
            <tr>
                <td><strong>${c.datos_postulante}</strong></td>
                <td>${c.sede} <br> <small class="text-secondary">${c.fuente}</small></td>
                <td><span class="${badgeClass}">${c.estado}</span></td>
                <td>${c.sub_estado}</td>
                <td>${c.prueba_manejo} / ${c.condicion}</td>
                <td>${c.responsable}</td>
                <td>${c.fecha_estado}</td>
                <td>
                    <button class="btn-icon info" onclick='viewHistory(${c.id})' title="Ver Historial">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <button class="btn-icon edit" onclick='editCandidato(${JSON.stringify(c).replace(/'/g, "&#39;")})' title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon delete" onclick='deleteCandidato(${c.id})' title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Actualizar KPIs
function updateKPIs() {
    const convocatoria = candidatosActuales.filter(c => c.estado === 'CONVOCATORIA').length;
    const capacitacion = candidatosActuales.filter(c => c.estado.includes('CAPACITACION')).length;
    const contratado = candidatosActuales.filter(c => c.estado === 'CONTRATADO').length;
    const rechazado = candidatosActuales.filter(c => c.estado === 'RECHAZADO').length;

    kpiConvocatoria.textContent = convocatoria;
    kpiCapacitacion.textContent = capacitacion;
    kpiContratado.textContent = contratado;
    kpiRechazado.textContent = rechazado;

    populateMonths();
    if(document.getElementById('view-reportes').style.display !== 'none') {
        renderCharts();
    }
}

// Guardar (Crear o Actualizar)
async function saveCandidato(e) {
    e.preventDefault();
    
    const id = document.getElementById('candidatoId').value;
    const data = {
        datos_postulante: document.getElementById('datos_postulante').value,
        fuente: document.getElementById('fuente').value,
        sede: document.getElementById('sede').value,
        condicion: document.getElementById('condicion').value,
        prueba_manejo: document.getElementById('prueba_manejo').value,
        estado: document.getElementById('estado').value,
        sub_estado: document.getElementById('sub_estado').value,
        fecha_estado: document.getElementById('fecha_estado').value,
        responsable: document.getElementById('responsable').value,
        observacion: document.getElementById('observacion').value
    };

    const url = id ? `${API_URL}/candidatos/${id}` : `${API_URL}/candidatos`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal();
            loadCandidatos();
        } else {
            const err = await response.json();
            alert('Error al guardar: ' + err.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor.');
    }
}

// Preparar edición
function editCandidato(candidato) {
    openModal(candidato);
}

// Eliminar candidato
async function deleteCandidato(id) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
        try {
            const response = await fetch(`${API_URL}/candidatos/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadCandidatos();
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    }
}

// Ver historial
async function viewHistory(id) {
    try {
        const response = await fetch(`${API_URL}/candidatos/${id}/historial`);
        const result = await response.json();
        
        const container = document.getElementById('historyContainer');
        if(result.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No hay historial registrado.</p>';
        } else {
            container.innerHTML = result.data.map(h => `
                <div style="border-left: 2px solid var(--primary-color); padding-left: 1rem; margin-bottom: 1.5rem; position: relative;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--primary-color); position: absolute; left: -7px; top: 3px;"></div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
                        <i class="fa-regular fa-calendar"></i> ${h.fecha_estado}
                    </div>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 1.05rem;">
                        ${h.estado} 
                        ${h.sub_estado ? `<span style="font-weight: 400; color: var(--text-secondary); font-size: 0.9rem;">(${h.sub_estado})</span>` : ''}
                    </div>
                    ${h.observacion ? `<div style="font-size: 0.9rem; margin-top: 0.5rem; background: #f8fafc; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border-color);">📝 ${h.observacion}</div>` : ''}
                    <div style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--info); font-weight: 500;">
                        <i class="fa-regular fa-user"></i> Responsable: ${h.responsable || 'No asignado'}
                    </div>
                </div>
            `).join('');
        }
        document.getElementById('historyModal').classList.add('active');
    } catch(err) {
        console.error(err);
    }
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('active');
}

// Exportar a Excel
function downloadExcel() {
    if (candidatosActuales.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    // Preparar datos para Excel
    const data = candidatosActuales.map(c => ({
        "Postulante": c.datos_postulante,
        "Sede": c.sede,
        "Fuente": c.fuente,
        "Condición": c.condicion,
        "Prueba de Manejo": c.prueba_manejo,
        "Estado Actual": c.estado,
        "Sub Estado": c.sub_estado,
        "Fecha de Estado": c.fecha_estado,
        "Responsable": c.responsable,
        "Observación": c.observacion
    }));

    // Crear hoja y libro de trabajo
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidatos");

    // Descargar archivo
    XLSX.writeFile(wb, "Reporte_Onboarding_RRHH.xlsx");
}

// Navegación
function switchView(view) {
    document.getElementById('view-tablero').style.display = view === 'tablero' ? 'block' : 'none';
    document.getElementById('view-reportes').style.display = view === 'reportes' ? 'block' : 'none';
    
    document.getElementById('menu-tablero').classList.toggle('active', view === 'tablero');
    document.getElementById('menu-reportes').classList.toggle('active', view === 'reportes');

    if(view === 'reportes') {
        renderCharts();
    }
}

// Extraer meses para el filtro
function populateMonths() {
    const select = document.getElementById('reportMonth');
    const currentValue = select.value;
    
    const meses = new Set();
    candidatosActuales.forEach(c => {
        if(c.fecha_estado) {
            meses.add(c.fecha_estado.substring(0, 7)); // YYYY-MM
        }
    });

    const opciones = Array.from(meses).sort().reverse();
    
    let html = '<option value="all">Todos los meses</option>';
    opciones.forEach(m => {
        html += `<option value="${m}">${m}</option>`;
    });
    
    select.innerHTML = html;
    if (opciones.includes(currentValue)) {
        select.value = currentValue;
    }
}

// Renderizar Gráficos
function renderCharts() {
    const mes = document.getElementById('reportMonth').value;
    
    const datosFiltrados = mes === 'all' 
        ? candidatosActuales 
        : candidatosActuales.filter(c => c.fecha_estado && c.fecha_estado.startsWith(mes));

    const estados = {
        'Convocatoria': 0,
        'Capacitación': 0,
        'Contratado': 0,
        'Rechazado': 0
    };

    datosFiltrados.forEach(c => {
        if(c.estado === 'CONVOCATORIA') estados['Convocatoria']++;
        else if(c.estado.includes('CAPACITACION')) estados['Capacitación']++;
        else if(c.estado === 'CONTRATADO') estados['Contratado']++;
        else if(c.estado === 'RECHAZADO') estados['Rechazado']++;
    });

    if(chartEstado) chartEstado.destroy();
    if(chartFunnel) chartFunnel.destroy();

    // Gráfico de Pie (Distribución)
    const ctxEstado = document.getElementById('estadoChart').getContext('2d');
    chartEstado = new Chart(ctxEstado, {
        type: 'doughnut',
        data: {
            labels: Object.keys(estados),
            datasets: [{
                data: Object.values(estados),
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Gráfico de Barras (Embudo simplificado)
    const ctxFunnel = document.getElementById('funnelChart').getContext('2d');
    chartFunnel = new Chart(ctxFunnel, {
        type: 'bar',
        data: {
            labels: ['Convocados', 'En Proceso (Capac.)', 'Contratados'],
            datasets: [{
                label: 'Cantidad de Personas',
                data: [
                    estados['Convocatoria'] + estados['Capacitación'] + estados['Contratado'] + estados['Rechazado'], 
                    estados['Capacitación'], 
                    estados['Contratado']
                ],
                backgroundColor: ['#6366f1', '#8b5cf6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
