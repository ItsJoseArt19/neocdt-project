const scanner = require('sonarqube-scanner').default || require('sonarqube-scanner');

/**
 * Script de análisis SonarQube para NeoCDT Backend
 * 
 * Este script ejecuta un análisis de calidad de código usando SonarQube.
 * Puede usar SonarCloud o una instancia local de SonarQube.
 * 
 * Uso:
 *   npm run sonar              # Análisis sin cobertura
 *   npm run sonar:coverage     # Análisis con cobertura de tests
 * 
 * Variables de entorno:
 *   SONAR_HOST_URL - URL del servidor SonarQube (default: http://localhost:9000)
 *   SONAR_TOKEN    - Token de autenticación (opcional para servidor local)
 */

scanner(
  {
    serverUrl: process.env.SONAR_HOST_URL || 'http://localhost:9000',
    token: process.env.SONAR_TOKEN || 'sqp_d986e4dab29281bde50d64bbce14f2f1e49a17f4',
    options: {
  'sonar.projectKey': 'NeoCDT-Backend',
  'sonar.projectName': 'NeoCDT Backend - Security Remediation',
      'sonar.projectVersion': '1.0.0',
      'sonar.sources': 'src',
      'sonar.tests': 'tests',
      'sonar.exclusions': '**/node_modules/**,**/coverage/**,**/dist/**,**/*.test.js,**/seeds/**',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.sourceEncoding': 'UTF-8',
      'sonar.javascript.node.maxspace': '4096',
      'sonar.qualitygate.wait': 'false',
    },
  },
  (error) => {
    if (error) {
      console.error('❌ Error en análisis de SonarQube:', error);
      process.exit(1);
    }
    console.log('✅ Análisis de SonarQube completado exitosamente');
    console.log('📊 Revisa los resultados en:', process.env.SONAR_HOST_URL || 'http://localhost:9000');
    process.exit(0);
  }
);
