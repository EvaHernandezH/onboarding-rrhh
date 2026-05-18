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
app.get('/api/candidatos', (req, res) => {
    db.all('SELECT * FROM candidatos ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Crear un nuevo candidato
app.post('/api/candidatos', (req, res) => {
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

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        const nuevoId = this.lastID;
        
        db.run(`INSERT INTO historial_candidatos 
            (candidato_id, estado, sub_estado, responsable, observacion, fecha_estado) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [nuevoId, estado, sub_estado, responsable, observacion, fecha_estado], 
            (err2) => {
                res.json({
                    message: 'success',
                    id: nuevoId
                });
        });
    });
});

// Actualizar un candidato (ej. cambio de estado)
app.put('/api/candidatos/:id', (req, res) => {
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

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        
        db.run(`INSERT INTO historial_candidatos 
            (candidato_id, estado, sub_estado, responsable, observacion, fecha_estado) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [req.params.id, estado, sub_estado, responsable, observacion, fecha_estado], 
            (err2) => {
                res.json({
                    message: 'success',
                    changes: this.changes
                });
        });
    });
});

// Eliminar un candidato
app.delete('/api/candidatos/:id', (req, res) => {
    db.run('DELETE FROM candidatos WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        db.run('DELETE FROM historial_candidatos WHERE candidato_id = ?', req.params.id);
        res.json({ message: 'deleted', changes: this.changes });
    });
});

// Obtener historial de un candidato
app.get('/api/candidatos/:id/historial', (req, res) => {
    db.all('SELECT * FROM historial_candidatos WHERE candidato_id = ? ORDER BY id DESC', [req.params.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
