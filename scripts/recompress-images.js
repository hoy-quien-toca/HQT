#!/usr/bin/env node
/**
 * Script para recomprimir imágenes viejas en el bucket de Supabase
 * Uso: node scripts/recompress-images.js
 * 
 * Recomprime todas las imágenes existentes a JPEG con calidad 0.75
 * y máximo 1200px de ancho/alto, reduciendo el tamaño dramáticamente.
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const tempDir = './.temp-compress';
let processed = 0;
let skipped = 0;
let errors = 0;

async function ensureTempDir() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}

async function downloadFile(bucket, path, filename) {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw error;
    
    const buffer = await data.arrayBuffer();
    const filepath = `${tempDir}/${filename}`;
    fs.writeFileSync(filepath, Buffer.from(buffer));
    return filepath;
  } catch (err) {
    console.error(`  ❌ Error descargando ${path}:`, err.message);
    return null;
  }
}

async function compressImage(inputPath) {
  try {
    const compressed = await sharp(inputPath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75, progressive: true })
      .toBuffer();
    
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = compressed.length;
    const savings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
    
    return { buffer: compressed, originalSize, compressedSize, savings };
  } catch (err) {
    console.error(`  ❌ Error comprimiendo imagen:`, err.message);
    return null;
  }
}

async function uploadFile(bucket, path, buffer) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .update(path, buffer, { contentType: 'image/jpeg', upsert: true });
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`  ❌ Error subiendo ${path}:`, err.message);
    return false;
  }
}

async function processFolder(bucket, folderPath) {
  console.log(`\n📁 Procesando carpeta: ${folderPath}`);
  
  try {
    const { data: files, error } = await supabase.storage.from(bucket).list(folderPath);
    
    if (error) throw error;
    if (!files || files.length === 0) {
      console.log('  ✓ Carpeta vacía, saltando...');
      return;
    }

    for (const file of files) {
      if (file.name === '.emptyFolderPlaceholder') continue;
      
      const filePath = `${folderPath}/${file.name}`;
      
      // Solo procesar imágenes
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
        console.log(`  ⊘ ${file.name} - no es imagen, saltando`);
        skipped++;
        continue;
      }

      console.log(`\n  📸 ${file.name}`);
      console.log(`     Tamaño original: ${(file.metadata.size / 1024).toFixed(1)} KB`);

      // Descargar
      const tempFile = await downloadFile(bucket, filePath, file.id || file.name);
      if (!tempFile) {
        errors++;
        continue;
      }

      // Comprimir
      const compressed = await compressImage(tempFile);
      if (!compressed) {
        errors++;
        fs.unlinkSync(tempFile);
        continue;
      }

      // Subir (reemplazar)
      const uploaded = await uploadFile(bucket, filePath, compressed.buffer);
      if (uploaded) {
        console.log(`     ✓ Comprimido: ${(compressed.compressedSize / 1024).toFixed(1)} KB (ahorro: ${compressed.savings}%)`);
        processed++;
      } else {
        errors++;
      }

      // Limpiar
      fs.unlinkSync(tempFile);
    }
  } catch (err) {
    console.error(`  ❌ Error en carpeta ${folderPath}:`, err.message);
  }
}

async function main() {
  console.log('🔄 Iniciando recompresión de imágenes...\n');
  
  await ensureTempDir();

  try {
    // Procesar carpetas
    await processFolder('hqt-assets', 'flyers');
    await processFolder('hqt-assets', 'sponsors');
    await processFolder('hqt-assets', 'interviews');

    // Limpiar carpeta temporal
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Proceso finalizado');
    console.log(`   Procesadas: ${processed}`);
    console.log(`   Saltadas: ${skipped}`);
    console.log(`   Errores: ${errors}`);
    console.log('='.repeat(50) + '\n');

  } catch (err) {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  }
}

main();
