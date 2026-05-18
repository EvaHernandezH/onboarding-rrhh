const express = require('express');
const cors = require('cors');
const db = require('./database');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Servir los archivos del frontend para que se abra como web
app.use(express.static(path.join(__dirname, '../frontend')));

// Obtener todos los candidatos
app.get('/api/candidatos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM candidatos ORDER BY id DESC');
        // Formatear fechas devueltas por MySQL para evitar conflictos de zona horaria
        const formattedRows = rows.map(r => {
            if (r.fecha_estado) {
                const dateObj = new Date(r.fecha_estado);
                r.fecha_estado = dateObj.toISOString().split('T')[0];
            }
            return r;
        });
        res.json({ data: formattedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear un nuevo candidato
app.post('/api/candidatos', async (req, res) => {
    const { 
        datos_postulante, fuente, sede, condicion, 
        prueba_manejo, estado, sub_estado, 
        fecha_estado, responsable, observacion 
    } = req.body;

    const sql = `INSERT INTO candidatos (
        datos_postulante, fuente, sede, condicion, 
        prueba_manejo, estado, sub_estado, 
        fecha_estado, responsable, observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
        datos_postulante, fuente, sede, condicion, 
        prueba_manejo, estado, sub_estado, 
        fecha_estado, responsable, observacion
    ];

    try {
        const [result] = await db.query(sql, params);
        const nuevoId = result.insertId;
        
        await db.query(`INSERT INTO historial_candidatos 
            (candidato_id, estado, sub_estado, responsable, observacion, fecha_estado) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [nuevoId, estado, sub_estado, responsable, observacion, fecha_estado]);
            
        res.json({ message: 'success', id: nuevoId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Actualizar un candidato (ej. cambio de estado)
app.put('/api/candidatos/:id', async (req, res) => {
    const { 
        datos_postulante, fuente, sede, condicion, 
        prueba_manejo, estado, sub_estado, 
        fecha_estado, responsable, observacion 
    } = req.body;

    const sql = `UPDATE candidatos SET 
        datos_postulante = ?, fuente = ?, sede = ?, condicion = ?, 
        prueba_manejo = ?, estado = ?, sub_estado = ?, 
        fecha_estado = ?, responsable = ?, observacion = ?
        WHERE id = ?`;
    
    const params = [
        datos_postulante, fuente, sede, condicion, 
        prueba_manejo, estado, sub_estado, 
        fecha_estado, responsable, observacion, req.params.id
    ];

    try {
        const [result] = await db.query(sql, params);
        
        await db.query(`INSERT INTO historial_candidatos 
            (candidato_id, estado, sub_estado, responsable, observacion, fecha_estado) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [req.params.id, estado, sub_estado, responsable, observacion, fecha_estado]);
            
        res.json({ message: 'success', changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Eliminar un candidato
app.delete('/api/candidatos/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM historial_candidatos WHERE candidato_id = ?', [req.params.id]);
        const [result] = await db.query('DELETE FROM candidatos WHERE id = ?', [req.params.id]);
        res.json({ message: 'deleted', changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Obtener historial de un candidato
app.get('/api/candidatos/:id/historial', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM historial_candidatos WHERE candidato_id = ? ORDER BY id DESC', [req.params.id]);
        const formattedRows = rows.map(r => {
            if (r.fecha_estado) {
                const dateObj = new Date(r.fecha_estado);
                r.fecha_estado = dateObj.toISOString().split('T')[0];
            }
            return r;
        });
        res.json({ data: formattedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
