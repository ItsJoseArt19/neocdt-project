const fs = require('fs');
const path = require('path');

/**
 * Analizador de Calidad de Código - NeoCDT Backend
 * 
 * Este script analiza el código fuente y genera métricas de calidad
 * similares a las que proporcionaría SonarQube.
 */

class CodeQualityAnalyzer {
  constructor() {
    this.metrics = {
      files: [],
      totalFiles: 0,
      totalLines: 0,
      totalCodeLines: 0,
      totalCommentLines: 0,
      totalBlankLines: 0,
      functions: 0,
      classes: 0,
      complexity: 0,
      codeSmells: [],
      duplications: [],
      longFunctions: [],
      largeFiles: [],
    };
  }

  analyzeDirectory(dirPath, baseDir = dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!file.includes('node_modules') && !file.includes('coverage') && !file.includes('tests')) {
          this.analyzeDirectory(filePath, baseDir);
        }
      } else if (file.endsWith('.js') && !file.includes('.test.js')) {
        this.analyzeFile(filePath, baseDir);
      }
    });
  }

  analyzeFile(filePath, baseDir) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(baseDir, filePath);

    const fileMetrics = {
      path: relativePath,
      totalLines: lines.length,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      functions: 0,
      complexity: 1, // Complejidad ciclomática base
      issues: [],
    };

    let inBlockComment = false;

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Líneas en blanco
      if (trimmed.length === 0) {
        fileMetrics.blankLines++;
        return;
      }

      // Comentarios de bloque
      if (trimmed.startsWith('/*')) {
        inBlockComment = true;
      }
      if (inBlockComment) {
        fileMetrics.commentLines++;
        if (trimmed.endsWith('*/')) {
          inBlockComment = false;
        }
        return;
      }

      // Comentarios de línea
      if (trimmed.startsWith('//')) {
        fileMetrics.commentLines++;
        return;
      }

      // Líneas de código
      fileMetrics.codeLines++;

      // Funciones
      if (trimmed.includes('function') || trimmed.match(/=>\s*{/) || trimmed.match(/^(export\s+)?(async\s+)?const\s+\w+\s*=/)) {
        fileMetrics.functions++;
      }

      // Complejidad ciclomática
      if (trimmed.includes('if') || trimmed.includes('else') || 
          trimmed.includes('for') || trimmed.includes('while') ||
          trimmed.includes('case') || trimmed.includes('catch') ||
          trimmed.includes('&&') || trimmed.includes('||') ||
          trimmed.includes('?')) {
        fileMetrics.complexity++;
      }

      // Code Smells
      this.detectCodeSmells(line, index + 1, fileMetrics, relativePath);
    });

    // Detectar funciones largas (más de 50 líneas)
    if (fileMetrics.codeLines > 50 && fileMetrics.functions === 1) {
      this.metrics.longFunctions.push({
        file: relativePath,
        lines: fileMetrics.codeLines
      });
    }

    // Detectar archivos grandes (más de 300 líneas)
    if (fileMetrics.codeLines > 300) {
      this.metrics.largeFiles.push({
        file: relativePath,
        lines: fileMetrics.codeLines
      });
    }

    this.metrics.files.push(fileMetrics);
    this.metrics.totalFiles++;
    this.metrics.totalLines += fileMetrics.totalLines;
    this.metrics.totalCodeLines += fileMetrics.codeLines;
    this.metrics.totalCommentLines += fileMetrics.commentLines;
    this.metrics.totalBlankLines += fileMetrics.blankLines;
    this.metrics.functions += fileMetrics.functions;
    this.metrics.complexity += fileMetrics.complexity;
  }

  detectCodeSmells(line, lineNumber, fileMetrics, filePath) {
    const trimmed = line.trim();

    // console.log sin comentario
    if (trimmed.includes('console.log') && !trimmed.startsWith('//')) {
      this.metrics.codeSmells.push({
        file: filePath,
        line: lineNumber,
        type: 'Console Statement',
        severity: 'Minor',
        message: 'Remove this console.log statement'
      });
    }

    // Variables sin const/let
    if (trimmed.match(/^\s*\w+\s*=/) && !trimmed.includes('const') && !trimmed.includes('let') && !trimmed.includes('var')) {
      this.metrics.codeSmells.push({
        file: filePath,
        line: lineNumber,
        type: 'Missing Declaration',
        severity: 'Major',
        message: 'Variable should be declared with const or let'
      });
    }

    // Funciones muy anidadas (más de 3 niveles de indentación)
    const indentation = line.match(/^\s*/)[0].length;
    if (indentation > 12) {
      this.metrics.codeSmells.push({
        file: filePath,
        line: lineNumber,
        type: 'Cognitive Complexity',
        severity: 'Major',
        message: 'Refactor this code to reduce nesting level'
      });
    }

    // TODO/FIXME
    if (trimmed.includes('TODO') || trimmed.includes('FIXME')) {
      this.metrics.codeSmells.push({
        file: filePath,
        line: lineNumber,
        type: 'TODO Comment',
        severity: 'Info',
        message: 'Complete the task associated with this TODO comment'
      });
    }
  }

  generateReport() {
    const commentRatio = ((this.metrics.totalCommentLines / this.metrics.totalCodeLines) * 100).toFixed(2);
    const avgComplexity = (this.metrics.complexity / this.metrics.functions).toFixed(2);
    const avgFileSize = (this.metrics.totalCodeLines / this.metrics.totalFiles).toFixed(2);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         REPORTE DE ANÁLISIS DE CALIDAD DE CÓDIGO              ║');
    console.log('║                  NeoCDT Backend - SonarQube                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 MÉTRICAS GENERALES');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Archivos analizados:        ${this.metrics.totalFiles}`);
    console.log(`   Total de líneas:            ${this.metrics.totalLines}`);
    console.log(`   Líneas de código:           ${this.metrics.totalCodeLines}`);
    console.log(`   Líneas de comentarios:      ${this.metrics.totalCommentLines}`);
    console.log(`   Líneas en blanco:           ${this.metrics.totalBlankLines}`);
    console.log(`   Funciones:                  ${this.metrics.functions}`);
    console.log(`   Ratio de comentarios:       ${commentRatio}%`);
    console.log(`   Tamaño promedio de archivo: ${avgFileSize} líneas\n`);

    console.log('🔍 COMPLEJIDAD');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Complejidad total:          ${this.metrics.complexity}`);
    console.log(`   Complejidad promedio:       ${avgComplexity}`);
    console.log(`   Estado: ${avgComplexity < 10 ? '✅ Bueno' : avgComplexity < 15 ? '⚠️  Moderado' : '❌ Alto'}\n`);

    console.log('🐛 CODE SMELLS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Total de code smells:       ${this.metrics.codeSmells.length}`);
    
    const smellsBySeverity = {
      'Major': this.metrics.codeSmells.filter(s => s.severity === 'Major').length,
      'Minor': this.metrics.codeSmells.filter(s => s.severity === 'Minor').length,
      'Info': this.metrics.codeSmells.filter(s => s.severity === 'Info').length,
    };
    
    console.log(`   - Major:                    ${smellsBySeverity.Major}`);
    console.log(`   - Minor:                    ${smellsBySeverity.Minor}`);
    console.log(`   - Info:                     ${smellsBySeverity.Info}\n`);

    if (this.metrics.codeSmells.length > 0) {
      console.log('   Top 10 Code Smells:');
      this.metrics.codeSmells.slice(0, 10).forEach((smell, i) => {
        console.log(`   ${i + 1}. [${smell.severity}] ${smell.file}:${smell.line}`);
        console.log(`      ${smell.message}\n`);
      });
    }

    console.log('📏 ARCHIVOS GRANDES');
    console.log('═══════════════════════════════════════════════════════════════');
    if (this.metrics.largeFiles.length > 0) {
      this.metrics.largeFiles.forEach(file => {
        console.log(`   ⚠️  ${file.file}: ${file.lines} líneas`);
      });
    } else {
      console.log('   ✅ No se encontraron archivos excesivamente grandes');
    }
    console.log('');

    console.log('🔧 FUNCIONES LARGAS');
    console.log('═══════════════════════════════════════════════════════════════');
    if (this.metrics.longFunctions.length > 0) {
      this.metrics.longFunctions.forEach(func => {
        console.log(`   ⚠️  ${func.file}: ${func.lines} líneas`);
      });
    } else {
      console.log('   ✅ No se encontraron funciones excesivamente largas');
    }
    console.log('');

    console.log('⭐ CALIFICACIÓN GENERAL');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const score = this.calculateScore(avgComplexity, commentRatio, smellsBySeverity);
    const grade = this.getGrade(score);
    
    console.log(`   Puntuación: ${score}/100`);
    console.log(`   Calificación: ${grade.emoji} ${grade.letter}`);
    console.log(`   Estado: ${grade.status}\n`);

    console.log('📝 RECOMENDACIONES');
    console.log('═══════════════════════════════════════════════════════════════');
    this.generateRecommendations(avgComplexity, commentRatio, smellsBySeverity);

    // Guardar reporte en archivo
    this.saveReport(score, grade);
  }

  calculateScore(avgComplexity, commentRatio, smellsBySeverity) {
    let score = 100;

    // Penalizar por complejidad alta
    if (avgComplexity > 15) score -= 20;
    else if (avgComplexity > 10) score -= 10;

    // Penalizar por pocos comentarios
    if (commentRatio < 10) score -= 15;
    else if (commentRatio < 20) score -= 5;

    // Penalizar por code smells
    score -= (smellsBySeverity.Major * 2);
    score -= (smellsBySeverity.Minor * 0.5);

    // Penalizar por archivos/funciones largas
    score -= (this.metrics.largeFiles.length * 3);
    score -= (this.metrics.longFunctions.length * 2);

    return Math.max(0, Math.round(score));
  }

  getGrade(score) {
    if (score >= 90) return { letter: 'A', emoji: '🌟', status: 'Excelente' };
    if (score >= 80) return { letter: 'B', emoji: '✅', status: 'Muy Bueno' };
    if (score >= 70) return { letter: 'C', emoji: '👍', status: 'Bueno' };
    if (score >= 60) return { letter: 'D', emoji: '⚠️', status: 'Aceptable' };
    return { letter: 'F', emoji: '❌', status: 'Necesita Mejoras' };
  }

  generateRecommendations(avgComplexity, commentRatio, smellsBySeverity) {
    const recommendations = [];

    if (avgComplexity > 10) {
      recommendations.push('- Refactorizar funciones complejas en funciones más pequeñas');
      recommendations.push('- Reducir el número de condiciones y bucles anidados');
    }

    if (commentRatio < 20) {
      recommendations.push('- Agregar más comentarios JSDoc a funciones públicas');
      recommendations.push('- Documentar la lógica de negocio compleja');
    }

    if (smellsBySeverity.Major > 0) {
      recommendations.push('- Resolver code smells de severidad Major prioritariamente');
    }

    if (this.metrics.codeSmells.filter(s => s.type === 'Console Statement').length > 0) {
      recommendations.push('- Remover o reemplazar console.log con un logger apropiado');
    }

    if (this.metrics.largeFiles.length > 0) {
      recommendations.push('- Dividir archivos grandes en módulos más pequeños');
    }

    if (recommendations.length === 0) {
      console.log('   ✅ ¡El código tiene excelente calidad! No hay recomendaciones críticas.\n');
    } else {
      recommendations.forEach(rec => console.log(`   ${rec}`));
      console.log('');
    }
  }

  saveReport(score, grade) {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      score: score,
      grade: grade.letter,
      status: grade.status,
    };

    const reportPath = path.join(__dirname, 'sonar-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Reporte guardado en: ${reportPath}\n`);
  }
}

// Ejecutar análisis
const analyzer = new CodeQualityAnalyzer();
const srcPath = path.join(__dirname, 'src');

console.log('🔍 Analizando código fuente...\n');
analyzer.analyzeDirectory(srcPath);
analyzer.generateReport();
