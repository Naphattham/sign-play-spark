const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStatic);

const videosDir = path.join(__dirname, 'public', 'videos');

function findMp4Files(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findMp4Files(filePath, fileList);
    } else if (file.endsWith('.mp4')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const mp4Files = findMp4Files(videosDir);

console.log(`Found ${mp4Files.length} MP4 files to convert.`);

async function convertFile(inputFile) {
  const outputFile = inputFile.replace(/\.mp4$/, '.webp');
  return new Promise((resolve, reject) => {
    console.log(`Converting: ${inputFile}`);
    ffmpeg(inputFile)
      .outputOptions([
        '-vcodec libwebp',
        '-lossless 0',
        '-compression_level 4',
        '-q:v 50',
        '-loop 0',
        '-preset default',
        '-an',
        '-vsync 0'
      ])
      .save(outputFile)
      .on('end', () => {
        console.log(`Finished: ${outputFile}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`Error converting ${inputFile}:`, err);
        reject(err);
      });
  });
}

async function start() {
  for (const file of mp4Files) {
    await convertFile(file);
    // Optionally delete the mp4 file
    // fs.unlinkSync(file);
  }
  console.log('All done!');
}

start();
