// index.js - Bot con LOGS SUPER DETALLADOS
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = (app) => {
  console.log('🟢 Bot inicializando...');
  console.log('🔑 Verificando API Key de Gemini...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY no está definida en .env');
    return;
  }
  
  console.log('✅ API Key encontrada:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
  
  // Inicializar Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  console.log('✅ Gemini inicializado correctamente');

  // Función para evaluar issue
  async function evaluarIssue(titulo, descripcion) {
    console.log('🔍 Evaluando issue con Gemini...');
    console.log('   Título:', titulo);
    console.log('   Descripción:', descripcion ? descripcion.substring(0, 50) + '...' : 'Sin descripción');
    
    try {
      const prompt = `Eres un experto en gestión de proyectos de software. Evalúa la calidad de este issue de GitHub.

Título: ${titulo}
Descripción: ${descripcion || 'Sin descripción'}

Evalúa según estos criterios:
- ¿Tiene un título claro y descriptivo?
- ¿La descripción es suficientemente detallada?
- ¿Incluye pasos para reproducir (si es un bug)?
- ¿Define el comportamiento esperado?
- ¿Incluye información del entorno?

Responde en JSON con este formato exacto:
{
  "score": 85,
  "aspectos_buenos": ["lista de cosas buenas"],
  "aspectos_mejorar": ["lista de cosas a mejorar"],
  "sugerencias": "texto con sugerencias específicas"
}`;

      console.log('📤 Enviando request a Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Respuesta recibida de Gemini');
      console.log('   Texto:', text.substring(0, 100) + '...');
      
      // Extraer JSON del texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluacion = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON parseado correctamente');
        console.log('   Score:', evaluacion.score);
        return evaluacion;
      }
      
      console.log('⚠️ No se encontró JSON en la respuesta, usando evaluación por defecto');
      return {
        score: 50,
        aspectos_buenos: ['Issue creado'],
        aspectos_mejorar: ['Agregar más detalles'],
        sugerencias: 'Por favor proporciona más información.'
      };
    } catch (error) {
      console.error('❌ Error al evaluar con Gemini:', error.message);
      return {
        score: 50,
        aspectos_buenos: [],
        aspectos_mejorar: ['Error al evaluar'],
        sugerencias: 'Hubo un problema al evaluar el issue.'
      };
    }
  }

  // Generar reporte visual
  function generarReporte(evaluacion, numeroIssue) {
    console.log('📝 Generando reporte...');
    
    const { score, aspectos_buenos, aspectos_mejorar, sugerencias } = evaluacion;
    
    let emoji = '✅';
    let estado = 'Excelente';
    let color = '🟢';
    
    if (score < 40) {
      emoji = '❌';
      estado = 'Necesita Mejoras Urgentes';
      color = '🔴';
    } else if (score < 70) {
      emoji = '⚠️';
      estado = 'Puede Mejorar';
      color = '🟡';
    }

    const barraLlena = Math.round(score / 5);
    const barraVacia = 20 - barraLlena;
    const barra = '█'.repeat(barraLlena) + '░'.repeat(barraVacia);

    let reporte = `## ${emoji} Evaluación de Calidad del Issue #${numeroIssue}\n\n`;
    reporte += `### ${color} Puntuación: ${score}/100 - ${estado}\n\n`;
    reporte += `\`${barra}\` ${score}%\n\n`;

    if (aspectos_buenos && aspectos_buenos.length > 0) {
      reporte += `### ✨ Aspectos Positivos\n\n`;
      aspectos_buenos.forEach(aspecto => {
        reporte += `- ✅ ${aspecto}\n`;
      });
      reporte += `\n`;
    }

    if (aspectos_mejorar && aspectos_mejorar.length > 0) {
      reporte += `### 🔧 Aspectos a Mejorar\n\n`;
      aspectos_mejorar.forEach(aspecto => {
        reporte += `- ⚠️ ${aspecto}\n`;
      });
      reporte += `\n`;
    }

    if (sugerencias) {
      reporte += `### 💡 Sugerencias\n\n${sugerencias}\n\n`;
    }

    reporte += `---\n`;
    reporte += `<sub>🤖 Evaluado por Google Gemini | Reacciona con 👍 si te fue útil</sub>`;

    console.log('✅ Reporte generado');
    return reporte;
  }

  // ===== EVENTOS =====
  
  console.log('🎧 Registrando listeners de eventos...');
  
  // Evento: Issue creado
  app.on('issues.opened', async (context) => {
    console.log('\n');
    console.log('='.repeat(80));
    console.log('🎉🎉🎉 ¡EVENTO RECIBIDO: issues.opened! 🎉🎉🎉');
    console.log('='.repeat(80));
    
    const issue = context.payload.issue;
    console.log('📝 Issue #' + issue.number);
    console.log('📋 Título:', issue.title);
    console.log('👤 Usuario:', issue.user.login);
    console.log('🏢 Repo:', context.payload.repository.full_name);
    
    try {
      console.log('\n🔄 Iniciando evaluación...');
      
      // Evaluar con Gemini
      const evaluacion = await evaluarIssue(issue.title, issue.body);
      
      // Generar reporte
      const reporte = generarReporte(evaluacion, issue.number);

      console.log('\n💬 Publicando comentario en GitHub...');
      console.log('   Owner:', context.payload.repository.owner.login);
      console.log('   Repo:', context.payload.repository.name);
      console.log('   Issue:', issue.number);
      
      // Publicar comentario
      const result = await context.octokit.issues.createComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: issue.number,
        body: reporte
      });

      console.log('✅ Comentario publicado exitosamente en GitHub');
      console.log('   URL:', result.data.html_url);

      // Agregar label según calidad
      console.log('\n🏷️ Agregando labels...');
      const labels = [];
      if (evaluacion.score >= 80) {
        labels.push('✅ calidad-excelente');
      } else if (evaluacion.score >= 60) {
        labels.push('👍 calidad-buena');
      } else if (evaluacion.score >= 40) {
        labels.push('⚠️ necesita-mejoras');
      } else {
        labels.push('❌ revisar-urgente');
      }

      if (labels.length > 0) {
        await context.octokit.issues.addLabels({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
          labels: labels
        });
        console.log('✅ Labels agregados:', labels.join(', '));
      }

      console.log('\n' + '='.repeat(80));
      console.log('✅✅✅ PROCESO COMPLETADO EXITOSAMENTE ✅✅✅');
      console.log(`Issue #${issue.number} evaluado: ${evaluacion.score}/100`);
      console.log('='.repeat(80));
      console.log('\n');
      
    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('❌❌❌ ERROR EN EL PROCESO ❌❌❌');
      console.error('='.repeat(80));
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('='.repeat(80));
      console.log('\n');
    }
  });

  // Evento: Issue editado
  app.on('issues.edited', async (context) => {
    console.log('\n');
    console.log('='.repeat(80));
    console.log('✏️ EVENTO RECIBIDO: issues.edited');
    console.log('='.repeat(80));
    
    const issue = context.payload.issue;
    console.log('📝 Issue #' + issue.number);
    console.log('📋 Título:', issue.title);
    
    try {
      console.log('🔍 Buscando comentario anterior del bot...');
      
      const comments = await context.octokit.issues.listComments({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: issue.number
      });

      const botComment = comments.data.find(
        comment => comment.user.type === 'Bot' && 
        comment.body.includes('Evaluación de Calidad del Issue')
      );

      console.log(botComment ? '✅ Comentario anterior encontrado' : '⚠️ No se encontró comentario previo');

      const evaluacion = await evaluarIssue(issue.title, issue.body);
      const reporte = generarReporte(evaluacion, issue.number);

      if (botComment) {
        console.log('🔄 Actualizando comentario existente...');
        await context.octokit.issues.updateComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          comment_id: botComment.id,
          body: reporte
        });
        console.log('✅ Comentario actualizado en GitHub');
      } else {
        console.log('📝 Creando nuevo comentario...');
        await context.octokit.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
          body: reporte
        });
        console.log('✅ Comentario creado en GitHub');
      }
      
      console.log('='.repeat(80));
      console.log('✅ Edición procesada correctamente');
      console.log('='.repeat(80));
      console.log('\n');
    } catch (error) {
      console.error('❌ Error al procesar edición:', error.message);
      console.error('Stack:', error.stack);
      console.log('\n');
    }
  });

  // Comando: /evaluar
  app.on('issue_comment.created', async (context) => {
    const comment = context.payload.comment;
    const issue = context.payload.issue;

    console.log('\n💬 Comentario recibido en issue #' + issue.number);
    console.log('   Usuario:', comment.user.login);
    console.log('   Texto:', comment.body);

    if (comment.body.trim().toLowerCase() === '/evaluar') {
      console.log('\n🎯 Comando /evaluar detectado');

      try {
        const evaluacion = await evaluarIssue(issue.title, issue.body);
        const reporte = generarReporte(evaluacion, issue.number);

        console.log('💬 Publicando re-evaluación...');
        await context.octokit.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
          body: reporte
        });

        console.log('✅ Re-evaluación publicada\n');
      } catch (error) {
        console.error('❌ Error en comando /evaluar:', error.message);
        console.error('Stack:', error.stack);
      }
    }

    if (comment.body.trim().toLowerCase() === '/mejorar') {
      console.log('\n✨ Comando /mejorar detectado');

      try {
        const prompt = `Reescribe este issue de GitHub para que sea más claro, completo y profesional.

Título actual: ${issue.title}
Descripción actual: ${issue.body || 'Sin descripción'}

Proporciona:
1. Un título mejorado
2. Una descripción mejorada en formato Markdown
3. Mantén toda la información original pero organízala mejor`;

        console.log('📤 Solicitando mejora a Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const mejora = response.text();

        console.log('💬 Publicando versión mejorada...');
        await context.octokit.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
          body: `## 🔄 Versión Mejorada Sugerida\n\n${mejora}\n\n---\n<sub>💡 Esta es una sugerencia. Puedes editar el issue original con esta información.</sub>`
        });

        console.log('✅ Versión mejorada publicada\n');
      } catch (error) {
        console.error('❌ Error en comando /mejorar:', error.message);
        console.error('Stack:', error.stack);
      }
    }
  });

  console.log('✅ Listeners registrados correctamente');
  console.log('🚀 Bot listo y esperando eventos...\n');
};