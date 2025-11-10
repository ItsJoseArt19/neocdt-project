/**
 * EVALUADOR DE ATRIBUTOS DE CALIDAD - NeoCDT Backend
 * Fase 5: Análisis exhaustivo de Performance, Security, Maintainability, Scalability
 */

const fs = require('fs');
const path = require('path');

// Configuración
const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'REPORTE_ATRIBUTOS_CALIDAD.md');

// Patrones de seguridad OWASP
const SECURITY_PATTERNS = {
  sqlInjection: /execute.*\+.*|query.*\+.*|WHERE.*\+/gi,
  hardcodedSecrets: /password\s*=\s*['"][^'"]+['"]|api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
  weakCrypto: /md5|sha1(?!256)/gi,
  evalUsage: /eval\s*\(/gi,
  unsafeRedirect: /res\.redirect\([^)]*req\./gi,
  commandInjection: /exec\(|spawn\(|execSync\(/gi,
  xxeVulnerability: /parseXML|DOMParser/gi,
  csrfMissing: /router\.post|router\.put|router\.delete/gi,
  sensitiveDataExposure: /console\.log.*password|console\.log.*token/gi,
  brokenAuth: /jwt\.sign\([^)]*,\s*['"][^'"]{1,10}['"]/gi
};

// Patrones de performance
const PERFORMANCE_PATTERNS = {
  nPlusOne: /forEach.*await|for.*await.*findBy/gi,
  inefficientQuery: /SELECT \*|\.findAll\(\)/gi,
  missingIndex: /WHERE.*=.*AND/gi,
  syncOperations: /Sync\(/gi,
  largePayload: /JSON\.stringify.*>/gi,
  noCache: /router\.(get|post).*async/gi,
  blockingIO: /readFileSync|writeFileSync/gi
};

// Métricas de mantenibilidad
const MAINTAINABILITY_METRICS = {
  maxCyclomaticComplexity: 10,
  maxFunctionLength: 50,
  maxFileLength: 300,
  minCommentRatio: 0.15,
  maxParameterCount: 5
};

class QualityAttributeEvaluator {
  constructor() {
    this.results = {
      security: { score: 0, issues: [], recommendations: [] },
      performance: { score: 0, issues: [], recommendations: [] },
      maintainability: { score: 0, metrics: {}, recommendations: [] },
      scalability: { score: 0, issues: [], recommendations: [] },
      reliability: { score: 0, issues: [], recommendations: [] }
    };
    this.files = [];
    this.totalLOC = 0;
  }

  // Escanear todos los archivos
  scanDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('coverage')) {
        this.scanDirectory(filePath, fileList);
      } else if (file.endsWith('.js') && !file.includes('.test.')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }

  // 1. EVALUACIÓN DE SEGURIDAD (OWASP Top 10)
  evaluateSecurity() {
    console.log('🔒 Evaluando Seguridad (OWASP Top 10)...\n');
    
    let totalIssues = 0;
    const issuesByCategory = {};

    this.files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(SRC_DIR, filePath);

      // A01:2021 - Broken Access Control
      const postRoutes = content.match(SECURITY_PATTERNS.csrfMissing) || [];
      if (postRoutes.length > 0 && !content.includes('csrf')) {
        this.addSecurityIssue('A01:2021 - Broken Access Control', 
          `Rutas POST/PUT/DELETE sin protección CSRF`, relativePath, 'HIGH');
        issuesByCategory['Access Control'] = (issuesByCategory['Access Control'] || 0) + 1;
      }

      // A02:2021 - Cryptographic Failures
      const weakCrypto = content.match(SECURITY_PATTERNS.weakCrypto) || [];
      if (weakCrypto.length > 0) {
        this.addSecurityIssue('A02:2021 - Cryptographic Failures',
          `Uso de algoritmos débiles: ${weakCrypto.join(', ')}`, relativePath, 'HIGH');
        issuesByCategory['Cryptography'] = (issuesByCategory['Cryptography'] || 0) + 1;
      }

      // A03:2021 - Injection
      const sqlInjection = content.match(SECURITY_PATTERNS.sqlInjection) || [];
      if (sqlInjection.length > 0) {
        this.addSecurityIssue('A03:2021 - Injection',
          `Posible SQL Injection detectada`, relativePath, 'CRITICAL');
        issuesByCategory['Injection'] = (issuesByCategory['Injection'] || 0) + 1;
      }

      const cmdInjection = content.match(SECURITY_PATTERNS.commandInjection) || [];
      if (cmdInjection.length > 0) {
        this.addSecurityIssue('A03:2021 - Injection',
          `Posible Command Injection: ${cmdInjection.join(', ')}`, relativePath, 'CRITICAL');
        issuesByCategory['Injection'] = (issuesByCategory['Injection'] || 0) + 1;
      }

      // A04:2021 - Insecure Design
      const hardcoded = content.match(SECURITY_PATTERNS.hardcodedSecrets) || [];
      if (hardcoded.length > 0) {
        this.addSecurityIssue('A04:2021 - Insecure Design',
          `Secretos hardcodeados detectados`, relativePath, 'CRITICAL');
        issuesByCategory['Insecure Design'] = (issuesByCategory['Insecure Design'] || 0) + 1;
      }

      // A05:2021 - Security Misconfiguration
      const evalUsage = content.match(SECURITY_PATTERNS.evalUsage) || [];
      if (evalUsage.length > 0) {
        this.addSecurityIssue('A05:2021 - Security Misconfiguration',
          `Uso inseguro de eval()`, relativePath, 'HIGH');
        issuesByCategory['Misconfiguration'] = (issuesByCategory['Misconfiguration'] || 0) + 1;
      }

      // A07:2021 - Identification and Authentication Failures
      const brokenAuth = content.match(SECURITY_PATTERNS.brokenAuth) || [];
      if (brokenAuth.length > 0) {
        this.addSecurityIssue('A07:2021 - Authentication Failures',
          `JWT secret muy corto (< 32 caracteres)`, relativePath, 'HIGH');
        issuesByCategory['Authentication'] = (issuesByCategory['Authentication'] || 0) + 1;
      }

      // A09:2021 - Security Logging and Monitoring Failures
      const sensitiveLog = content.match(SECURITY_PATTERNS.sensitiveDataExposure) || [];
      if (sensitiveLog.length > 0) {
        this.addSecurityIssue('A09:2021 - Logging Failures',
          `Datos sensibles en logs`, relativePath, 'MEDIUM');
        issuesByCategory['Logging'] = (issuesByCategory['Logging'] || 0) + 1;
      }
    });

    totalIssues = this.results.security.issues.length;

    // Calcular score (100 - penalización por issues)
    const criticalPenalty = this.results.security.issues.filter(i => i.severity === 'CRITICAL').length * 20;
    const highPenalty = this.results.security.issues.filter(i => i.severity === 'HIGH').length * 10;
    const mediumPenalty = this.results.security.issues.filter(i => i.severity === 'MEDIUM').length * 5;
    
    this.results.security.score = Math.max(0, 100 - criticalPenalty - highPenalty - mediumPenalty);

    // Recomendaciones
    if (totalIssues === 0) {
      this.results.security.recommendations.push('✅ No se detectaron vulnerabilidades OWASP críticas');
    } else {
      this.results.security.recommendations.push('🔧 Implementar CSRF protection en rutas POST/PUT/DELETE');
      this.results.security.recommendations.push('🔧 Usar bcrypt/argon2 para hashing de passwords');
      this.results.security.recommendations.push('🔧 Validar y sanitizar todas las entradas de usuario');
      this.results.security.recommendations.push('🔧 Usar variables de entorno para secretos');
      this.results.security.recommendations.push('🔧 Implementar rate limiting');
      this.results.security.recommendations.push('🔧 Usar helmet.js para headers de seguridad');
    }

    console.log(`   Issues encontrados: ${totalIssues}`);
    console.log(`   Score: ${this.results.security.score}/100\n`);
  }

  addSecurityIssue(category, description, file, severity) {
    this.results.security.issues.push({
      category,
      description,
      file,
      severity
    });
  }

  // 2. EVALUACIÓN DE PERFORMANCE
  evaluatePerformance() {
    console.log('⚡ Evaluando Performance...\n');

    let totalIssues = 0;

    this.files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(SRC_DIR, filePath);

      // N+1 Queries
      const nPlusOne = content.match(PERFORMANCE_PATTERNS.nPlusOne) || [];
      if (nPlusOne.length > 0) {
        this.addPerformanceIssue('N+1 Query Problem',
          `Posible N+1 query en loops: ${nPlusOne.length} ocurrencias`, relativePath, 'HIGH');
        totalIssues++;
      }

      // Operaciones síncronas bloqueantes
      const syncOps = content.match(PERFORMANCE_PATTERNS.syncOperations) || [];
      if (syncOps.length > 0) {
        this.addPerformanceIssue('Blocking Operations',
          `Operaciones síncronas bloqueantes: ${syncOps.length} encontradas`, relativePath, 'MEDIUM');
        totalIssues++;
      }

      // SELECT * queries
      const inefficientQueries = content.match(PERFORMANCE_PATTERNS.inefficientQuery) || [];
      if (inefficientQueries.length > 0) {
        this.addPerformanceIssue('Inefficient Queries',
          `Queries SELECT * o findAll() detectadas`, relativePath, 'MEDIUM');
        totalIssues++;
      }

      // Falta de indexación
      if (content.includes('WHERE') && !content.includes('INDEX')) {
        const whereCount = (content.match(/WHERE/gi) || []).length;
        if (whereCount > 3) {
          this.addPerformanceIssue('Missing Indexes',
            `Múltiples WHEREs sin índices explícitos`, relativePath, 'LOW');
          totalIssues++;
        }
      }
    });

    // Calcular score
    const highPenalty = this.results.performance.issues.filter(i => i.severity === 'HIGH').length * 15;
    const mediumPenalty = this.results.performance.issues.filter(i => i.severity === 'MEDIUM').length * 8;
    const lowPenalty = this.results.performance.issues.filter(i => i.severity === 'LOW').length * 3;
    
    this.results.performance.score = Math.max(0, 100 - highPenalty - mediumPenalty - lowPenalty);

    // Recomendaciones
    this.results.performance.recommendations.push('⚡ Implementar eager loading para relaciones');
    this.results.performance.recommendations.push('⚡ Usar operaciones asíncronas (async/await)');
    this.results.performance.recommendations.push('⚡ Crear índices para columnas frecuentemente consultadas');
    this.results.performance.recommendations.push('⚡ Implementar caching (Redis/Memory Cache)');
    this.results.performance.recommendations.push('⚡ Limitar resultados con paginación');
    this.results.performance.recommendations.push('⚡ Usar connection pooling');

    console.log(`   Issues encontrados: ${totalIssues}`);
    console.log(`   Score: ${this.results.performance.score}/100\n`);
  }

  addPerformanceIssue(category, description, file, severity) {
    this.results.performance.issues.push({
      category,
      description,
      file,
      severity
    });
  }

  // 3. EVALUACIÓN DE MANTENIBILIDAD
  evaluateMaintainability() {
    console.log('🔧 Evaluando Mantenibilidad...\n');

    let totalLOC = 0;
    let totalCommentLines = 0;
    let totalFunctions = 0;
    let complexFunctions = 0;
    let longFunctions = 0;
    let largeFiles = 0;

    this.files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(SRC_DIR, filePath);

      // Contar líneas (mejorado para contar todos los tipos de comentarios)
      let inBlockComment = false;
      let commentLineCount = 0;
      let codeLineCount = 0;

      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Detectar inicio de bloque de comentario
        if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
          inBlockComment = true;
          commentLineCount++;
        } 
        // Detectar fin de bloque de comentario
        else if (inBlockComment && (trimmed.endsWith('*/') || trimmed.includes('*/'))) {
          inBlockComment = false;
          commentLineCount++;
        }
        // Dentro de bloque de comentario
        else if (inBlockComment) {
          commentLineCount++;
        }
        // Comentario de línea simple
        else if (trimmed.startsWith('//')) {
          commentLineCount++;
        }
        // Línea de código
        else if (trimmed && !inBlockComment) {
          codeLineCount++;
        }
      });
      
      totalLOC += codeLineCount;
      totalCommentLines += commentLineCount;

      // Archivos grandes
      if (lines.length > MAINTAINABILITY_METRICS.maxFileLength) {
        largeFiles++;
        this.addMaintainabilityIssue('Large File',
          `Archivo muy largo: ${lines.length} líneas (max: ${MAINTAINABILITY_METRICS.maxFileLength})`,
          relativePath, 'MEDIUM');
      }

      // Analizar funciones
      const functionMatches = content.matchAll(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>|async\s+(?:function\s+)?\w+\s*\([^)]*\))/g);
      
      for (const match of functionMatches) {
        totalFunctions++;
        const funcStart = match.index;
        const funcContent = this.extractFunctionBody(content, funcStart);
        
        // Complejidad ciclomática
        const complexity = this.calculateCyclomaticComplexity(funcContent);
        if (complexity > MAINTAINABILITY_METRICS.maxCyclomaticComplexity) {
          complexFunctions++;
        }

        // Funciones largas
        const funcLines = funcContent.split('\n').length;
        if (funcLines > MAINTAINABILITY_METRICS.maxFunctionLength) {
          longFunctions++;
        }
      }
    });

    // Calcular métricas
    const commentRatio = totalCommentLines / (totalLOC + totalCommentLines);
    const avgComplexity = complexFunctions / Math.max(totalFunctions, 1);

    this.results.maintainability.metrics = {
      totalLOC,
      commentRatio: (commentRatio * 100).toFixed(2) + '%',
      totalFunctions,
      complexFunctions,
      longFunctions,
      largeFiles,
      avgComplexityRatio: (avgComplexity * 100).toFixed(2) + '%'
    };

    // Calcular score
    let score = 100;
    if (commentRatio < MAINTAINABILITY_METRICS.minCommentRatio) score -= 20;
    score -= largeFiles * 10;
    score -= complexFunctions * 5;
    score -= longFunctions * 3;

    this.results.maintainability.score = Math.max(0, score);

    // Recomendaciones
    if (commentRatio < MAINTAINABILITY_METRICS.minCommentRatio) {
      this.results.maintainability.recommendations.push('📝 Incrementar comentarios JSDoc (target: 15-20%)');
    }
    if (complexFunctions > 0) {
      this.results.maintainability.recommendations.push('🔀 Refactorizar funciones complejas (complexity > 10)');
    }
    if (longFunctions > 0) {
      this.results.maintainability.recommendations.push('✂️ Dividir funciones largas en funciones más pequeñas');
    }
    if (largeFiles > 0) {
      this.results.maintainability.recommendations.push('📦 Dividir archivos grandes en módulos más pequeños');
    }
    this.results.maintainability.recommendations.push('📐 Seguir principios SOLID');
    this.results.maintainability.recommendations.push('🎯 Mantener Single Responsibility Principle');

    console.log(`   Total LOC: ${totalLOC}`);
    console.log(`   Comment Ratio: ${(commentRatio * 100).toFixed(2)}%`);
    console.log(`   Score: ${this.results.maintainability.score}/100\n`);
  }

  addMaintainabilityIssue(category, description, file, severity) {
    this.results.maintainability.recommendations.push(`${severity}: ${description} en ${file}`);
  }

  extractFunctionBody(content, startIndex) {
    let braceCount = 0;
    let inFunction = false;
    let funcBody = '';
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
      }
      
      if (inFunction) {
        funcBody += char;
      }
      
      if (inFunction && braceCount === 0) {
        break;
      }
    }
    
    return funcBody;
  }

  calculateCyclomaticComplexity(code) {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse\s+if\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /&&/g, /\|\|/g, /\?/g];
    
    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  // 4. EVALUACIÓN DE ESCALABILIDAD
  evaluateScalability() {
    console.log('📈 Evaluando Escalabilidad...\n');

    let issues = 0;

    // Verificar patrones que afectan escalabilidad
    this.files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(SRC_DIR, filePath);

      // Estado global/singleton patterns
      if (content.match(/let\s+\w+\s*=\s*null;.*module\.exports/s) || 
          content.match(/class\s+\w+\s*{[^}]*static\s+instance/)) {
        this.addScalabilityIssue('Global State',
          'Uso de estado global puede dificultar escalabilidad horizontal', relativePath, 'MEDIUM');
        issues++;
      }

      // Falta de paginación
      if (content.includes('findAll') && !content.includes('limit') && !content.includes('LIMIT')) {
        this.addScalabilityIssue('Missing Pagination',
          'Queries sin paginación pueden causar problemas con grandes datasets', relativePath, 'HIGH');
        issues++;
      }

      // Procesamiento síncrono pesado
      if (content.match(/for\s*\([^)]*\)\s*{[^}]*await/)) {
        this.addScalabilityIssue('Sequential Processing',
          'Procesamiento secuencial puede beneficiarse de paralelización', relativePath, 'MEDIUM');
        issues++;
      }
    });

    // Calcular score
    const highPenalty = this.results.scalability.issues.filter(i => i.severity === 'HIGH').length * 15;
    const mediumPenalty = this.results.scalability.issues.filter(i => i.severity === 'MEDIUM').length * 8;
    
    this.results.scalability.score = Math.max(0, 100 - highPenalty - mediumPenalty);

    // Recomendaciones
    this.results.scalability.recommendations.push('📊 Implementar paginación en todos los endpoints de listado');
    this.results.scalability.recommendations.push('🔄 Usar colas para procesamiento asíncrono (Bull/RabbitMQ)');
    this.results.scalability.recommendations.push('💾 Implementar caching distribuido (Redis)');
    this.results.scalability.recommendations.push('⚖️ Diseñar para stateless servers');
    this.results.scalability.recommendations.push('🌐 Usar CDN para assets estáticos');
    this.results.scalability.recommendations.push('📡 Implementar health checks y metrics');

    console.log(`   Issues encontrados: ${issues}`);
    console.log(`   Score: ${this.results.scalability.score}/100\n`);
  }

  addScalabilityIssue(category, description, file, severity) {
    this.results.scalability.issues.push({
      category,
      description,
      file,
      severity
    });
  }

  // 5. EVALUACIÓN DE CONFIABILIDAD
  evaluateReliability() {
    console.log('🛡️ Evaluando Confiabilidad...\n');

    let errorHandling = 0;
    let totalAsyncFunctions = 0;
    let missingErrorHandling = 0;

    this.files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(SRC_DIR, filePath);

      // Contar funciones async
      const asyncFunctions = content.match(/async\s+(?:function|\w+\s*\(|\([^)]*\)\s*=>)/g) || [];
      totalAsyncFunctions += asyncFunctions.length;

      // Verificar try-catch
      const tryCatchBlocks = content.match(/try\s*{/g) || [];
      errorHandling += tryCatchBlocks.length;

      // Funciones async sin try-catch
      if (asyncFunctions.length > tryCatchBlocks.length) {
        missingErrorHandling += (asyncFunctions.length - tryCatchBlocks.length);
      }

      // Verificar validaciones de entrada
      const validations = content.match(/if\s*\(.*(!|==|===).*\)/g) || [];
      if (validations.length === 0 && content.includes('export')) {
        this.addReliabilityIssue('Missing Input Validation',
          'Archivo sin validaciones de entrada aparentes', relativePath, 'MEDIUM');
      }
    });

    const errorHandlingRatio = errorHandling / Math.max(totalAsyncFunctions, 1);
    
    // Calcular score
    let score = 100;
    if (errorHandlingRatio < 0.8) score -= 30;
    if (missingErrorHandling > 10) score -= 20;
    score -= this.results.reliability.issues.length * 5;

    this.results.reliability.score = Math.max(0, score);
    this.results.reliability.errorHandlingRatio = (errorHandlingRatio * 100).toFixed(2) + '%';

    // Recomendaciones
    this.results.reliability.recommendations.push('✅ Implementar try-catch en todas las funciones async');
    this.results.reliability.recommendations.push('🔍 Validar todas las entradas de usuario');
    this.results.reliability.recommendations.push('📋 Usar middleware de validación (express-validator)');
    this.results.reliability.recommendations.push('🚨 Implementar logging de errores centralizado');
    this.results.reliability.recommendations.push('🔄 Implementar retry logic para operaciones críticas');
    this.results.reliability.recommendations.push('💾 Implementar backups automáticos de BD');

    console.log(`   Error Handling Ratio: ${(errorHandlingRatio * 100).toFixed(2)}%`);
    console.log(`   Score: ${this.results.reliability.score}/100\n`);
  }

  addReliabilityIssue(category, description, file, severity) {
    this.results.reliability.issues.push({
      category,
      description,
      file,
      severity
    });
  }

  // Calcular score general
  calculateOverallScore() {
    const weights = {
      security: 0.30,
      performance: 0.20,
      maintainability: 0.20,
      scalability: 0.15,
      reliability: 0.15
    };

    return (
      this.results.security.score * weights.security +
      this.results.performance.score * weights.performance +
      this.results.maintainability.score * weights.maintainability +
      this.results.scalability.score * weights.scalability +
      this.results.reliability.score * weights.reliability
    ).toFixed(2);
  }

  getGrade(score) {
    if (score >= 90) return { grade: 'A', emoji: '🌟', status: 'Excelente' };
    if (score >= 80) return { grade: 'B', emoji: '👍', status: 'Bueno' };
    if (score >= 70) return { grade: 'C', emoji: '👌', status: 'Aceptable' };
    if (score >= 60) return { grade: 'D', emoji: '⚠️', status: 'Necesita Mejoras' };
    return { grade: 'F', emoji: '❌', status: 'Crítico' };
  }

  // Generar reporte
  generateReport() {
    const overallScore = this.calculateOverallScore();
    const gradeInfo = this.getGrade(overallScore);

    let report = `# 🎯 REPORTE DE ATRIBUTOS DE CALIDAD
## NeoCDT Backend - Evaluación Exhaustiva

**Fecha de Análisis:** ${new Date().toLocaleString('es-ES')}  
**Archivos Analizados:** ${this.files.length}  
**Total Líneas de Código:** ${this.totalLOC}

---

## 📊 PUNTUACIÓN GENERAL

### ${gradeInfo.emoji} Calificación: **${gradeInfo.grade}** (${overallScore}/100)
**Estado:** ${gradeInfo.status}

\`\`\`
┌─────────────────────────────────────┐
│  DISTRIBUCIÓN DE PUNTUACIONES       │
├─────────────────────────────────────┤
│  🔒 Seguridad:        ${this.results.security.score.toString().padEnd(5)} / 100  │
│  ⚡ Performance:      ${this.results.performance.score.toString().padEnd(5)} / 100  │
│  🔧 Mantenibilidad:   ${this.results.maintainability.score.toString().padEnd(5)} / 100  │
│  📈 Escalabilidad:    ${this.results.scalability.score.toString().padEnd(5)} / 100  │
│  🛡️ Confiabilidad:    ${this.results.reliability.score.toString().padEnd(5)} / 100  │
└─────────────────────────────────────┘
\`\`\`

---

## 🔒 1. SEGURIDAD (OWASP Top 10)

### Puntuación: ${this.results.security.score}/100

### Issues Detectados: ${this.results.security.issues.length}

`;

    if (this.results.security.issues.length > 0) {
      const criticalIssues = this.results.security.issues.filter(i => i.severity === 'CRITICAL');
      const highIssues = this.results.security.issues.filter(i => i.severity === 'HIGH');
      const mediumIssues = this.results.security.issues.filter(i => i.severity === 'MEDIUM');

      if (criticalIssues.length > 0) {
        report += `\n#### 🚨 CRÍTICOS (${criticalIssues.length})\n\n`;
        criticalIssues.forEach(issue => {
          report += `- **${issue.category}**\n`;
          report += `  - ${issue.description}\n`;
          report += `  - Archivo: \`${issue.file}\`\n\n`;
        });
      }

      if (highIssues.length > 0) {
        report += `\n#### ⚠️ ALTOS (${highIssues.length})\n\n`;
        highIssues.forEach(issue => {
          report += `- **${issue.category}**\n`;
          report += `  - ${issue.description}\n`;
          report += `  - Archivo: \`${issue.file}\`\n\n`;
        });
      }

      if (mediumIssues.length > 0) {
        report += `\n#### ℹ️ MEDIOS (${mediumIssues.length})\n\n`;
        mediumIssues.forEach(issue => {
          report += `- **${issue.category}**\n`;
          report += `  - ${issue.description}\n`;
          report += `  - Archivo: \`${issue.file}\`\n\n`;
        });
      }
    } else {
      report += `\n✅ **No se detectaron vulnerabilidades críticas**\n\n`;
    }

    report += `\n### 🔧 Recomendaciones de Seguridad\n\n`;
    this.results.security.recommendations.forEach(rec => {
      report += `${rec}\n`;
    });

    report += `\n---

## ⚡ 2. PERFORMANCE

### Puntuación: ${this.results.performance.score}/100

### Issues Detectados: ${this.results.performance.issues.length}

`;

    if (this.results.performance.issues.length > 0) {
      this.results.performance.issues.forEach(issue => {
        report += `- **${issue.category}** [${issue.severity}]\n`;
        report += `  - ${issue.description}\n`;
        report += `  - Archivo: \`${issue.file}\`\n\n`;
      });
    } else {
      report += `\n✅ **No se detectaron issues críticos de performance**\n\n`;
    }

    report += `\n### 🔧 Recomendaciones de Performance\n\n`;
    this.results.performance.recommendations.forEach(rec => {
      report += `${rec}\n`;
    });

    report += `\n---

## 🔧 3. MANTENIBILIDAD

### Puntuación: ${this.results.maintainability.score}/100

### Métricas Clave

| Métrica | Valor |
|---------|-------|
| Total LOC | ${this.results.maintainability.metrics.totalLOC} |
| Ratio de Comentarios | ${this.results.maintainability.metrics.commentRatio} |
| Total Funciones | ${this.results.maintainability.metrics.totalFunctions} |
| Funciones Complejas | ${this.results.maintainability.metrics.complexFunctions} |
| Funciones Largas | ${this.results.maintainability.metrics.longFunctions} |
| Archivos Grandes | ${this.results.maintainability.metrics.largeFiles} |

### 🔧 Recomendaciones de Mantenibilidad

`;
    this.results.maintainability.recommendations.forEach(rec => {
      report += `${rec}\n`;
    });

    report += `\n---

## 📈 4. ESCALABILIDAD

### Puntuación: ${this.results.scalability.score}/100

### Issues Detectados: ${this.results.scalability.issues.length}

`;

    if (this.results.scalability.issues.length > 0) {
      this.results.scalability.issues.forEach(issue => {
        report += `- **${issue.category}** [${issue.severity}]\n`;
        report += `  - ${issue.description}\n`;
        report += `  - Archivo: \`${issue.file}\`\n\n`;
      });
    } else {
      report += `\n✅ **Arquitectura preparada para escalabilidad**\n\n`;
    }

    report += `\n### 🔧 Recomendaciones de Escalabilidad\n\n`;
    this.results.scalability.recommendations.forEach(rec => {
      report += `${rec}\n`;
    });

    report += `\n---

## 🛡️ 5. CONFIABILIDAD

### Puntuación: ${this.results.reliability.score}/100

### Métricas

- **Error Handling Ratio:** ${this.results.reliability.errorHandlingRatio}
- **Issues Detectados:** ${this.results.reliability.issues.length}

`;

    if (this.results.reliability.issues.length > 0) {
      this.results.reliability.issues.forEach(issue => {
        report += `- **${issue.category}** [${issue.severity}]\n`;
        report += `  - ${issue.description}\n`;
        report += `  - Archivo: \`${issue.file}\`\n\n`;
      });
    }

    report += `\n### 🔧 Recomendaciones de Confiabilidad\n\n`;
    this.results.reliability.recommendations.forEach(rec => {
      report += `${rec}\n`;
    });

    report += `\n---

## 📋 PLAN DE ACCIÓN PRIORITARIO

### 🚨 Prioridad CRÍTICA (Inmediato)
`;

    const criticalSecurity = this.results.security.issues.filter(i => i.severity === 'CRITICAL');
    if (criticalSecurity.length > 0) {
      report += `1. **Resolver ${criticalSecurity.length} vulnerabilidades críticas de seguridad**\n`;
      criticalSecurity.forEach(issue => {
        report += `   - ${issue.category}: ${issue.description}\n`;
      });
    }

    report += `\n### ⚠️ Prioridad ALTA (Esta semana)
`;

    const highSecurity = this.results.security.issues.filter(i => i.severity === 'HIGH');
    if (highSecurity.length > 0) {
      report += `1. **Resolver ${highSecurity.length} vulnerabilidades altas de seguridad**\n`;
    }

    const highPerformance = this.results.performance.issues.filter(i => i.severity === 'HIGH');
    if (highPerformance.length > 0) {
      report += `2. **Optimizar ${highPerformance.length} issues de performance**\n`;
    }

    report += `\n### 📅 Prioridad MEDIA (Este mes)

1. Mejorar ratio de comentarios a 15-20%
2. Refactorizar funciones complejas
3. Implementar caching
4. Agregar más validaciones de entrada

### 📈 Mejora Continua (Próximos sprints)

1. Implementar métricas y monitoring
2. Agregar más tests de integración
3. Documentar APIs con Swagger/OpenAPI
4. Implementar CI/CD completo

---

## 🎓 CONCLUSIONES

`;

    if (overallScore >= 80) {
      report += `El backend de NeoCDT muestra una **calidad general excelente** con un score de ${overallScore}/100. `;
      report += `Los atributos de calidad están bien implementados, con algunas áreas menores de mejora.\n\n`;
    } else if (overallScore >= 70) {
      report += `El backend de NeoCDT tiene una **calidad aceptable** con un score de ${overallScore}/100. `;
      report += `Hay oportunidades de mejora en seguridad, performance y mantenibilidad que deben abordarse.\n\n`;
    } else {
      report += `El backend de NeoCDT necesita **mejoras significativas** con un score de ${overallScore}/100. `;
      report += `Se recomienda priorizar las acciones críticas antes de pasar a producción.\n\n`;
    }

    report += `### Fortalezas Destacadas

`;

    if (this.results.security.score >= 80) report += `✅ Buenas prácticas de seguridad implementadas\n`;
    if (this.results.performance.score >= 80) report += `✅ Performance optimizado\n`;
    if (this.results.maintainability.score >= 80) report += `✅ Código mantenible y bien estructurado\n`;
    if (this.results.scalability.score >= 80) report += `✅ Arquitectura escalable\n`;
    if (this.results.reliability.score >= 80) report += `✅ Sistema confiable con buen manejo de errores\n`;

    report += `\n### Áreas de Mejora Prioritarias

`;

    if (this.results.security.score < 80) report += `⚠️ Fortalecer seguridad (OWASP compliance)\n`;
    if (this.results.performance.score < 80) report += `⚠️ Optimizar performance (queries, caching)\n`;
    if (this.results.maintainability.score < 80) report += `⚠️ Mejorar mantenibilidad (documentación, refactoring)\n`;
    if (this.results.scalability.score < 80) report += `⚠️ Preparar para escalabilidad (paginación, stateless)\n`;
    if (this.results.reliability.score < 80) report += `⚠️ Incrementar confiabilidad (error handling, validaciones)\n`;

    report += `\n---

**Generado por:** NeoCDT Quality Analyzer v1.0  
**Metodología:** ISO 25010, OWASP Top 10, Clean Code Principles  
`;

    return report;
  }

  // Ejecutar evaluación completa
  async run() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     EVALUACIÓN DE ATRIBUTOS DE CALIDAD - NeoCDT Backend       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Escanear archivos
    this.files = this.scanDirectory(SRC_DIR);
    console.log(`📁 Archivos a analizar: ${this.files.length}\n`);

    // Ejecutar evaluaciones
    this.evaluateSecurity();
    this.evaluatePerformance();
    this.evaluateMaintainability();
    this.evaluateScalability();
    this.evaluateReliability();

    // Generar reporte
    console.log('📝 Generando reporte...\n');
    const report = this.generateReport();
    
    fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    EVALUACIÓN COMPLETADA                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Reporte guardado en: ${OUTPUT_FILE}\n`);
    console.log(`📊 Puntuación General: ${this.calculateOverallScore()}/100\n`);

    // Guardar JSON para análisis programático
    const jsonReport = {
      timestamp: new Date().toISOString(),
      overallScore: this.calculateOverallScore(),
      results: this.results
    };
    fs.writeFileSync(
      path.join(__dirname, 'quality-attributes-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );
  }
}

// Ejecutar
const evaluator = new QualityAttributeEvaluator();
evaluator.run().catch(console.error);
