/**
 * @file logger.ts
 * @description Centralized logging utility for traceability.
 * 
 * Use Cases:
 * - Log user actions, AI requests, and errors.
 * - Strip sensitive or large payloads (like base64 images) before logging.
 * 
 * Interactions:
 * - Used across components and library files.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    let metaString = '';
    
    if (meta) {
      // Clone meta to avoid mutating the original object
      const safeMeta = JSON.parse(JSON.stringify(meta));
      
      // Strip large base64 strings if present in meta
      if (safeMeta.image && typeof safeMeta.image === 'string' && safeMeta.image.length > 100) {
        safeMeta.image = `[BASE64_IMAGE_TRUNCATED_LENGTH_${safeMeta.image.length}]`;
      }
      if (safeMeta.inlineData && safeMeta.inlineData.data) {
         safeMeta.inlineData.data = `[BASE64_IMAGE_TRUNCATED]`;
      }

      metaString = JSON.stringify(safeMeta);
    }

    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaString}`;
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Specialized logger for GenAI calls to ensure consistent tracing.
   */
  ai(action: string, meta: { model: string; promptName?: string; config?: any; output?: any; error?: any }) {
    if (meta.error) {
      this.error(`AI_CALL_FAILED: ${action}`, meta);
    } else {
      this.info(`AI_CALL_SUCCESS: ${action}`, meta);
    }
  }
}

export const logger = new Logger();
