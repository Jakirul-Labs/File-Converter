const $ = (selector) => document.querySelector(selector);
const toast = $('#toast');
const madeLine = document.querySelector('.footer .made');
if (madeLine && !madeLine.querySelector('.developer-credit')) {
  const credit = document.createElement('span');
  credit.className = 'developer-credit';
  credit.textContent = 'Developed By Md. Jakirul Islam';
  credit.style.cssText = 'display:block;font-size:18px;line-height:1.5;margin-top:7px;color:inherit;';
  madeLine.appendChild(document.createElement('br'));
  madeLine.appendChild(credit);
}
let toastTimer;
function showToast(message){ toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>toast.classList.remove('show'),2800); }

// Theme
const themeToggle = $('#themeToggle');
themeToggle.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  localStorage.setItem('convertly-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
if(localStorage.getItem('convertly-theme') === 'dark') document.body.classList.add('dark');

// Tools dropdown
const menuButton = $('#toolsMenuButton');
const dropdown = $('#toolsDropdown');
menuButton.addEventListener('click',()=>{
  const isOpen = dropdown.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
document.addEventListener('click',(event)=>{
  if(!event.target.closest('.nav-dropdown-wrap')){dropdown.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}
});

// Image Converter
const modal = $('#imageConverterModal');
const converterInput = $('#converterFiles');
const converterDropzone = $('#converterDropzone');
const conversionList = $('#conversionList');
const convertButton = $('#convertImages');
const clearButton = $('#clearImages');
const outputFormat = $('#outputFormat');
const qualityControl = $('#qualityControl');
const qualityInput = $('#outputQuality');
const qualityValue = $('#qualityValue');
const jpegOption = outputFormat.querySelector('option[value="image/jpeg"]');
if (jpegOption) jpegOption.textContent = 'JPEG';
let selectedImages = [];
let convertedUrls = [];
let previewUrls = [];
let isConverting = false;

function openConverter(files = []) {
  modal.classList.add('visible');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  if(files.length) addImageFiles(files);
  $('#closeConverter').focus();
}
function closeConverter() {
  if(isConverting) return;
  modal.classList.remove('visible');
  modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
$('#closeConverter').addEventListener('click', closeConverter);
modal.addEventListener('click', event => { if(event.target === modal) closeConverter(); });
document.addEventListener('keydown', event => { if(event.key === 'Escape' && modal.classList.contains('visible')) closeConverter(); });

function clearConvertedUrls() {
  convertedUrls.forEach(url => URL.revokeObjectURL(url));
  convertedUrls = [];
}
function clearPreviewUrls() {
  previewUrls.forEach(url => URL.revokeObjectURL(url));
  previewUrls = [];
}
function formatBytes(bytes) {
  if(bytes < 1024) return `${bytes} B`;
  if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function safeName(name) { return name.replace(/\.[^.]+$/, '').replace(/[\/:*?"<>|]/g, '_'); }
function addImageFiles(fileList) {
  const incoming = Array.from(fileList);
  const valid = incoming.filter(file => ['image/png','image/jpeg','image/webp'].includes(file.type));
  const rejected = incoming.length - valid.length;
  if(rejected) showToast(`${rejected} unsupported file${rejected === 1 ? '' : 's'} skipped. Use PNG, JPG or WebP.`);
  if(!valid.length) return;
  const existing = new Set(selectedImages.map(item => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
  valid.forEach(file => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if(!existing.has(key)) selectedImages.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, file, previewUrl: null, resultUrl: null, resultBlob: null, resultName: null, status: 'Ready' });
  });
  renderImageList();
}
function renderImageList() {
  clearConvertedUrls();
  clearPreviewUrls();
  selectedImages.forEach(item => { item.resultUrl = null; item.resultBlob = null; item.resultName = null; item.status = 'Ready'; });
  $('#fileCount').textContent = `${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected`;
  clearButton.disabled = selectedImages.length === 0;
  convertButton.disabled = selectedImages.length === 0 || isConverting;
  if(!selectedImages.length) { conversionList.innerHTML = '<div class="empty-files">Your selected images will appear here.</div>'; return; }
  selectedImages.forEach(item => { item.previewUrl = URL.createObjectURL(item.file); previewUrls.push(item.previewUrl); });
  conversionList.innerHTML = selectedImages.map(item => `
    <article class="conversion-item" data-id="${item.id}">
      <img class="file-thumb" src="${item.previewUrl}" alt="">
      <div class="file-details"><strong title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong><small>${formatBytes(item.file.size)} · ${item.file.type.split('/')[1].toUpperCase()}</small></div>
      <span class="file-status">${item.status}</span>
      <span class="file-result"></span>
    </article>`).join('');
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }

$('#addImagesButton').addEventListener('click', () => converterInput.click());
converterDropzone.addEventListener('click', event => { if(event.target.id !== 'addImagesButton') converterInput.click(); });
converterDropzone.addEventListener('keydown', event => { if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); converterInput.click(); } });
converterInput.addEventListener('change', () => { addImageFiles(converterInput.files); converterInput.value = ''; });
['dragenter','dragover'].forEach(type => converterDropzone.addEventListener(type, event => { event.preventDefault(); converterDropzone.classList.add('dragover'); }));
['dragleave','drop'].forEach(type => converterDropzone.addEventListener(type, event => { event.preventDefault(); converterDropzone.classList.remove('dragover'); }));
converterDropzone.addEventListener('drop', event => addImageFiles(event.dataTransfer.files));
clearButton.addEventListener('click', () => { selectedImages = []; clearConvertedUrls(); clearPreviewUrls(); renderImageList(); });
outputFormat.addEventListener('change', () => { qualityControl.hidden = outputFormat.value === 'image/png'; });
qualityInput.addEventListener('input', () => qualityValue.value = `${qualityInput.value}%`);
qualityControl.hidden = outputFormat.value === 'image/png';

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be opened.')); };
    image.src = url;
  });
}
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not convert this image.')), type, quality));
}
async function convertOne(item, type, quality) {
  const image = await loadImage(item.file);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if(type === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0,0,canvas.width,canvas.height); }
  context.drawImage(image,0,0);
  const blob = await canvasToBlob(canvas,type,quality);
  const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
  item.resultBlob = blob;
  item.resultUrl = URL.createObjectURL(blob);
  convertedUrls.push(item.resultUrl);
  item.resultName = `${safeName(item.file.name)}.${extension}`;
  item.status = 'Done';
}
function renderConvertedState() {
  selectedImages.forEach(item => {
    const row = conversionList.querySelector(`[data-id="${item.id}"]`);
    if(!row) return;
    row.querySelector('.file-status').textContent = item.status;
    const result = row.querySelector('.file-result');
    if(item.resultBlob) {
      result.innerHTML = `<small>${formatBytes(item.resultBlob.size)}</small><a class="download-link" href="${item.resultUrl}" download="${escapeHtml(item.resultName)}">Download</a>`;
    } else if(item.status === 'Error') { result.textContent = 'Could not convert'; }
  });
}
convertButton.addEventListener('click', async () => {
  if(isConverting || !selectedImages.length) return;
  isConverting = true;
  convertButton.disabled = true;
  convertButton.textContent = 'Converting…';
  clearButton.disabled = true;
  clearConvertedUrls();
  selectedImages.forEach(item => { item.resultBlob = null; item.resultUrl = null; item.status = 'Processing'; const row = conversionList.querySelector(`[data-id="${item.id}"]`); if(row) row.querySelector('.file-result').innerHTML = ''; });
  renderConvertedState();
  const type = outputFormat.value;
  const quality = Number(qualityInput.value) / 100;
  let success = 0;
  for(const item of selectedImages) {
    try { await convertOne(item,type,quality); success++; }
    catch(error) { item.status = 'Error'; console.error(error); }
    renderConvertedState();
  }
  isConverting = false;
  convertButton.disabled = selectedImages.length === 0;
  convertButton.textContent = 'Convert Images';
  clearButton.disabled = selectedImages.length === 0;
  showToast(`${success} of ${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} converted.`);
});

// Homepage upload routes image files into the converter
const fileInput = $('#fileInput');
const dropZone = $('#dropZone');
$('#chooseFiles').addEventListener('click', event => { event.stopPropagation(); fileInput.click(); });
dropZone.addEventListener('click', event => { if(event.target.id !== 'chooseFiles') fileInput.click(); });
fileInput.addEventListener('change', () => { if(fileInput.files.length) openConverter(fileInput.files); fileInput.value = ''; });
['dragenter','dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('dragover'); }));
['dragleave','drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('dragover'); }));
dropZone.addEventListener('drop', event => { if(event.dataTransfer.files.length) openConverter(event.dataTransfer.files); });

// Additional tools — injected from JavaScript so the homepage HTML/CSS stays unchanged.
const extraStyle = document.createElement('style');
extraStyle.textContent = `
.extra-modal{position:fixed;inset:0;z-index:110;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(12,16,43,.58);backdrop-filter:blur(7px)}
.extra-modal.visible{display:flex}.extra-panel{width:min(760px,100%);max-height:90vh;overflow:auto;background:var(--surface,#fff);color:var(--text,#20243a);border:1px solid var(--border,#e5e7f0);border-radius:24px;padding:26px;box-shadow:0 24px 80px rgba(14,18,60,.28)}
.extra-head{display:flex;justify-content:space-between;gap:16px;margin-bottom:20px}.extra-head h2{font-size:26px;margin:4px 0}.extra-head p{font-size:14px;color:var(--muted,#73788c);margin:0}.extra-close{width:38px;height:38px;border:1px solid var(--border,#e5e7f0);border-radius:50%;background:var(--bg,#f8f9ff);color:inherit;font-size:24px;cursor:pointer}.extra-body{display:grid;gap:14px}.extra-drop{border:2px dashed #a49cff;border-radius:16px;padding:25px;text-align:center;background:rgba(99,91,255,.045);cursor:pointer}.extra-drop strong,.extra-drop span{display:block}.extra-drop span{font-size:13px;color:var(--muted,#73788c);margin-top:6px}.extra-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.extra-field{display:grid;gap:6px;flex:1;min-width:130px;font-size:13px;font-weight:700}.extra-field input,.extra-field select,.extra-field textarea{width:100%;padding:11px 12px;border:1px solid var(--border,#e5e7f0);border-radius:10px;background:var(--bg,#f8f9ff);color:inherit;font:inherit}.extra-field textarea{min-height:90px;resize:vertical}.extra-action{border:0;border-radius:11px;background:var(--primary,#635bff);color:white;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer}.extra-action:disabled{opacity:.5;cursor:not-allowed}.extra-result{font-size:13px;color:var(--muted,#73788c);overflow-wrap:anywhere}.extra-preview{max-width:100%;max-height:280px;object-fit:contain;border-radius:12px}.extra-list{display:grid;gap:8px}.extra-file{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border,#e5e7f0);border-radius:12px;font-size:13px}.extra-file img{width:46px;height:46px;object-fit:cover;border-radius:7px}.extra-file a{margin-left:auto;color:var(--primary,#635bff);font-weight:700}.extra-qr{display:flex;justify-content:center;padding:16px;background:white;border-radius:12px;min-height:80px}.extra-note{font-size:12px;color:var(--muted,#73788c);line-height:1.5}.extra-check{display:flex;gap:8px;align-items:center;font-size:13px}.extra-panel video{width:100%;max-height:300px;background:#111;border-radius:12px}
`;
document.head.appendChild(extraStyle);

const extraModal = document.createElement('div');
extraModal.className = 'extra-modal';
extraModal.innerHTML = `<section class="extra-panel" role="dialog" aria-modal="true"><div class="extra-head"><div><span class="modal-kicker">CONVERTLY TOOLS</span><h2 id="extraTitle"></h2><p id="extraSubtitle"></p></div><button class="extra-close" type="button" aria-label="Close">×</button></div><div class="extra-body" id="extraBody"></div></section>`;
document.body.appendChild(extraModal);
const extraBody = extraModal.querySelector('#extraBody');
const extraTitle = extraModal.querySelector('#extraTitle');
const extraSubtitle = extraModal.querySelector('#extraSubtitle');
let extraCleanup = [];
function cleanupExtra(){ extraCleanup.forEach(fn=>{try{fn()}catch{}}); extraCleanup=[]; }
function closeExtra(){ cleanupExtra(); extraModal.classList.remove('visible'); document.body.classList.remove('modal-open'); }
extraModal.querySelector('.extra-close').addEventListener('click',closeExtra);
extraModal.addEventListener('click',e=>{if(e.target===extraModal)closeExtra()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&extraModal.classList.contains('visible'))closeExtra()});
function openExtra(title,subtitle,html){ cleanupExtra(); extraTitle.textContent=title; extraSubtitle.textContent=subtitle; extraBody.innerHTML=html; extraModal.classList.add('visible'); document.body.classList.add('modal-open'); }
function loadLibrary(src, test){
  if(test && test()) return Promise.resolve();
  const existing=[...document.scripts].find(s=>s.src===src);
  if(existing) return new Promise((resolve,reject)=>{if(test&&test())resolve();else{existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true})}});
  return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('A required library could not load. Check your internet connection and try again.'));document.head.appendChild(s)});
}
function chooseFile(accept,multiple=false){return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept=accept;input.multiple=multiple;input.onchange=()=>resolve([...input.files]);input.click()})}
function saveBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function saveZip(entries,name){await loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);const zip=new window.JSZip();entries.forEach(item=>zip.file(item.name,item.blob));const blob=await zip.generateAsync({type:'blob'});saveBlob(blob,name)}
function imageToCanvas(file,width=null,height=null,white=false){return loadImage(file).then(img=>{const w=width||img.naturalWidth,h=height||img.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(white){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}ctx.drawImage(img,0,0,w,h);return c})}
function canvasBlob(canvas,type,quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image processing failed.')),type,quality))}
function extFor(type){return type==='image/jpeg'?'jpg':type==='image/png'?'png':'webp'}
function imageType(file){return ['image/png','image/jpeg','image/webp'].includes(file.type)}
function fileBase(name){return safeName(name)}
function renderPickedFiles(files,container){container.innerHTML=files.map(f=>`<div class="extra-file"><span>▧</span><span>${escapeHtml(f.name)} · ${formatBytes(f.size)}</span></div>`).join('')}

// Image Compressor — user-controlled target file size (reduce or increase).
async function launchCompressor(){
 openExtra('Image Compressor','Choose whether to reduce or increase the file size, and set your target.',`<div class="extra-drop" id="compressPick"><strong>Choose images</strong><span>PNG, JPEG and WebP · Multiple files supported</span></div><div class="extra-row"><label class="extra-field">Output format<select id="compressType"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></label><label class="extra-field">File size action<select id="compressMode"><option value="reduce">Reduce to target size</option><option value="increase">Increase to target size</option></select></label></div><div class="extra-row"><label class="extra-field">Target size<input id="compressTarget" type="number" min="1" step="0.1" value="500" inputmode="decimal"></label><label class="extra-field">Unit<select id="compressUnit"><option value="1024">KB</option><option value="1048576">MB</option></select></label></div><label class="extra-field">Quality <output id="compressVal">85%</output><input id="compressQuality" type="range" min="20" max="100" value="85"></label><p class="extra-note" id="compressHint">The tool will aim for a file size at or below your target. If needed, image dimensions may be reduced.</p><div class="extra-list" id="compressList"></div><button class="extra-action" id="compressGo" disabled>Process Images</button><div class="extra-result" id="compressResult"></div>`);
 let files=[];const pick=extraBody.querySelector('#compressPick'),list=extraBody.querySelector('#compressList'),go=extraBody.querySelector('#compressGo'),quality=extraBody.querySelector('#compressQuality'),typeEl=extraBody.querySelector('#compressType'),modeEl=extraBody.querySelector('#compressMode'),targetEl=extraBody.querySelector('#compressTarget'),unitEl=extraBody.querySelector('#compressUnit');
 const add=fs=>{files.push(...fs.filter(imageType));files=[...new Map(files.map(f=>[f.name+f.size,f])).values()];renderPickedFiles(files,list);go.disabled=!files.length};
 pick.onclick=async()=>add(await chooseFile('image/png,image/jpeg,image/webp',true));
 quality.oninput=()=>extraBody.querySelector('#compressVal').textContent=quality.value+'%';
 modeEl.onchange=()=>{extraBody.querySelector('#compressHint').textContent=modeEl.value==='reduce'?'The tool will aim for a file size at or below your target. If needed, image dimensions may be reduced.':'The tool will aim for a file size at or above your target. If needed, the image will be upscaled; this increases file size but does not add real detail.'};
 async function encodeAt(file,type,w,h,q){const c=await imageToCanvas(file,w,h,type==='image/jpeg');return canvasBlob(c,type,q)}
 async function bestQuality(file,type,w,h,target,mode,fallbackQ){
   if(type==='image/png') return encodeAt(file,type,w,h,1);
   let low=.05,high=1,best=null;
   for(let i=0;i<10;i++){const q=(low+high)/2,b=await encodeAt(file,type,w,h,q);if(mode==='reduce'){if(b.size<=target){best=b;low=q}else high=q}else{if(b.size>=target){best=b;high=q}else low=q}}
   if(!best) best=await encodeAt(file,type,w,h,mode==='reduce'?.05:1);
   return best;
 }
 async function makeTarget(file,type,target,mode,fallbackQ){
   const img=await loadImage(file);let w=img.naturalWidth,h=img.naturalHeight;const originalW=w,originalH=h;let blob;
   if(mode==='reduce'){
     for(let pass=0;pass<18;pass++){
       blob=await bestQuality(file,type,w,h,target,'reduce',fallbackQ);
       if(blob.size<=target || (w<80&&h<80)) break;
       const factor=Math.max(.65,Math.min(.92,Math.sqrt(target/blob.size)*.94));w=Math.max(1,Math.round(w*factor));h=Math.max(1,Math.round(h*factor));
     }
   }else{
     for(let pass=0;pass<16;pass++){
       blob=type==='image/png'?await encodeAt(file,type,w,h,1):await encodeAt(file,type,w,h,1);
       if(blob.size>=target || w>=originalW*4 || h>=originalH*4) break;
       const factor=Math.min(1.25,Math.max(1.05,Math.sqrt(target/Math.max(1,blob.size))*1.04));w=Math.min(originalW*4,Math.round(w*factor));h=Math.min(originalH*4,Math.round(h*factor));
     }
     if(type!=='image/png' && blob.size>=target) blob=await bestQuality(file,type,w,h,target,'increase',fallbackQ);
   }
   return {blob,width:w,height:h,originalWidth:originalW,originalHeight:originalH};
 }
 go.onclick=async()=>{
   const entered=Number(targetEl.value),target=entered*Number(unitEl.value),mode=modeEl.value,type=typeEl.value,q=Number(quality.value)/100;
   if(!Number.isFinite(target)||target<=0){showToast('Enter a valid target file size.');return}
   go.disabled=true;go.textContent='Processing…';const entries=[],reports=[];
   for(const f of files){try{const result=await makeTarget(f,type,target,mode,q),name=`${fileBase(f.name)}-${mode==='reduce'?'reduced':'resized'}.${extFor(type)}`;entries.push({name,blob:result.blob});const changed=result.blob.size-f.size;reports.push(`${f.name}: ${formatBytes(f.size)} → ${formatBytes(result.blob.size)} (${changed<=0?'-':'+'}${formatBytes(Math.abs(changed))})`)}catch(e){console.error(e);reports.push(`${f.name}: failed`)} }
   try{if(entries.length===1)saveBlob(entries[0].blob,entries[0].name);else if(entries.length)await saveZip(entries,'convertly-processed-images.zip')}catch(e){showToast(e.message)}
   extraBody.querySelector('#compressResult').textContent=reports.join(' · ')+(mode==='increase'?' · Upscaling cannot restore lost image detail.':'');go.disabled=false;go.textContent='Process Images';
 };
}
// Image Resizer
async function launchResizer(){
 openExtra('Image Resizer','Set custom dimensions or resize by percentage.',`<div class="extra-drop" id="resizePick"><strong>Choose an image</strong><span>PNG, JPEG or WebP</span></div><div class="extra-row"><label class="extra-field">Width (px)<input id="resizeW" type="number" min="1" max="12000" placeholder="Width"></label><label class="extra-field">Height (px)<input id="resizeH" type="number" min="1" max="12000" placeholder="Height"></label></div><label class="extra-check"><input type="checkbox" id="resizeLock" checked> Keep aspect ratio</label><label class="extra-field">Output format<select id="resizeType"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><img class="extra-preview" id="resizePreview" hidden><button class="extra-action" id="resizeGo" disabled>Resize & Download</button><div class="extra-result" id="resizeResult"></div>`);
 let file=null,ratio=1;const pick=extraBody.querySelector('#resizePick'),w=extraBody.querySelector('#resizeW'),h=extraBody.querySelector('#resizeH'),lock=extraBody.querySelector('#resizeLock'),go=extraBody.querySelector('#resizeGo');
 pick.onclick=async()=>{[file]=await chooseFile('image/png,image/jpeg,image/webp');if(!file)return;const img=await loadImage(file);ratio=img.naturalWidth/img.naturalHeight;w.value=img.naturalWidth;h.value=img.naturalHeight;const u=URL.createObjectURL(file),preview=extraBody.querySelector('#resizePreview');preview.src=u;preview.hidden=false;extraCleanup.push(()=>URL.revokeObjectURL(u));go.disabled=false};
 w.oninput=()=>{if(lock.checked&&w.value)h.value=Math.max(1,Math.round(Number(w.value)/ratio))};h.oninput=()=>{if(lock.checked&&h.value)w.value=Math.max(1,Math.round(Number(h.value)*ratio))};
 go.onclick=async()=>{if(!file)return;const ww=Number(w.value),hh=Number(h.value);if(!ww||!hh||ww>12000||hh>12000){showToast('Enter valid dimensions up to 12000 px.');return}go.disabled=true;try{const type=extraBody.querySelector('#resizeType').value,c=await imageToCanvas(file,ww,hh,type==='image/jpeg'),b=await canvasBlob(c,type,.92);saveBlob(b,`${fileBase(file.name)}-${ww}x${hh}.${extFor(type)}`);extraBody.querySelector('#resizeResult').textContent=`Done · ${ww} × ${hh} px · ${formatBytes(b.size)}`}catch(e){showToast(e.message)}go.disabled=false};
}

// Batch Converter — multi-image format conversion in one action.
async function launchBatch(){
 openExtra('Batch Converter','Convert multiple images to one chosen format at once.',`<div class="extra-drop" id="batchPick"><strong>Choose multiple images</strong><span>PNG, JPEG and WebP</span></div><label class="extra-field">Convert all to<select id="batchType"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><label class="extra-field">Quality <output id="batchVal">90%</output><input id="batchQuality" type="range" min="40" max="100" value="90"></label><div class="extra-list" id="batchList"></div><button class="extra-action" id="batchGo" disabled>Convert All</button><div class="extra-result" id="batchResult"></div>`);
 let files=[];const pick=extraBody.querySelector('#batchPick'),list=extraBody.querySelector('#batchList'),go=extraBody.querySelector('#batchGo'),q=extraBody.querySelector('#batchQuality');pick.onclick=async()=>{files=(await chooseFile('image/png,image/jpeg,image/webp',true)).filter(imageType);renderPickedFiles(files,list);go.disabled=!files.length};q.oninput=()=>extraBody.querySelector('#batchVal').textContent=q.value+'%';
 go.onclick=async()=>{go.disabled=true;const type=extraBody.querySelector('#batchType').value,entries=[];for(const f of files){try{const c=await imageToCanvas(f,null,null,type==='image/jpeg'),b=await canvasBlob(c,type,Number(q.value)/100);entries.push({name:`${fileBase(f.name)}.${extFor(type)}`,blob:b})}catch(e){console.error(e)}}try{if(entries.length===1)saveBlob(entries[0].blob,entries[0].name);else if(entries.length)await saveZip(entries,'convertly-batch-converted.zip')}catch(e){showToast(e.message)}extraBody.querySelector('#batchResult').textContent=`${entries.length} of ${files.length} images converted${entries.length>1?' · ZIP downloaded':''}.`;go.disabled=false};
}

// PDF library helpers (loaded only when the user opens the relevant tool).
async function ensurePdfLib(){await loadLibrary('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',()=>!!window.PDFLib);return window.PDFLib}
async function ensurePdfJs(){await loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',()=>!!window.pdfjsLib);window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';return window.pdfjsLib}
async function ensureJsPdf(){await loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf);return window.jspdf.jsPDF}

// Image to PDF
async function launchImagePdf(){
 openExtra('Image → PDF','Combine one or more images into a downloadable PDF.',`<div class="extra-drop" id="imgPdfPick"><strong>Choose images</strong><span>PNG, JPEG and WebP · Selected order is preserved</span></div><div class="extra-list" id="imgPdfList"></div><div class="extra-row"><label class="extra-field">Page size<select id="pdfPageSize"><option value="a4">A4</option><option value="letter">Letter</option><option value="fit">Fit image</option></select></label><label class="extra-field">Orientation<select id="pdfOrientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label></div><button class="extra-action" id="imgPdfGo" disabled>Create PDF</button><div class="extra-result" id="imgPdfResult"></div>`);
 let files=[];const pick=extraBody.querySelector('#imgPdfPick'),list=extraBody.querySelector('#imgPdfList'),go=extraBody.querySelector('#imgPdfGo');pick.onclick=async()=>{files=(await chooseFile('image/png,image/jpeg,image/webp',true)).filter(imageType);renderPickedFiles(files,list);go.disabled=!files.length};
 go.onclick=async()=>{go.disabled=true;try{const {PDFDocument}=await ensurePdfLib(),pdf=await PDFDocument.create(),size=extraBody.querySelector('#pdfPageSize').value,orientation=extraBody.querySelector('#pdfOrientation').value;for(const f of files){const bytes=await f.arrayBuffer(),img=f.type==='image/png'?await pdf.embedPng(bytes):await pdf.embedJpg(await imageToJpegBytes(f));let pw=size==='fit'?img.width:size==='letter'?612:595,ph=size==='fit'?img.height:size==='letter'?792:842;if(size!=='fit'&&orientation==='landscape')[pw,ph]=[ph,pw];const page=pdf.addPage([pw,ph]),scale=Math.min((pw-48)/img.width,(ph-48)/img.height),dw=img.width*scale,dh=img.height*scale;page.drawImage(img,{x:(pw-dw)/2,y:(ph-dh)/2,width:dw,height:dh})}const bytes=await pdf.save();saveBlob(new Blob([bytes],{type:'application/pdf'}),'convertly-images.pdf');extraBody.querySelector('#imgPdfResult').textContent=`Created PDF with ${files.length} page(s).`}catch(e){showToast(e.message||'Could not create PDF.');console.error(e)}go.disabled=false};
}
async function imageToJpegBytes(file){const c=await imageToCanvas(file,null,null,true),b=await canvasBlob(c,'image/jpeg',.92);return b.arrayBuffer()}

// Word to PDF — DOCX is rendered inside an isolated iframe (so the site's CSS cannot change the layout),
// Word text boxes are rebuilt as real positioned boxes, then every page is exported to PDF with a hidden text layer.
const WORD_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const WORD_MARK='CVBOX';
const WORD_FRAME_HTML=`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff;color:#000;font-family:'Times New Roman',Times,'Liberation Serif',serif}
*{box-sizing:content-box}
#docxRoot .docx-wrapper{background:#fff!important;padding:0!important;display:block!important}
#docxRoot .docx-wrapper>section.docx{box-shadow:none!important;margin:0!important}
a{color:inherit;text-decoration:none}
</style><div id="docxStyles"></div></head><body><div id="docxRoot"></div></body></html>`;
function wdChild(el,name){if(!el)return null;for(const c of el.children)if(c.nodeName===name)return c;return null}
function wdOn(rPr,tag){const e=wdChild(rPr,'w:'+tag);if(!e)return false;const v=e.getAttribute('w:val');return !(v==='0'||v==='false'||v==='off')}
function wdColor(node,fallback){
  const fill=wdChild(node,'a:solidFill');if(!fill)return fallback;
  const rgb=wdChild(fill,'a:srgbClr');if(rgb)return '#'+rgb.getAttribute('val');
  const sch=wdChild(fill,'a:schemeClr');
  if(sch){const map={tx1:'#000000',dk1:'#000000',bg1:'#ffffff',lt1:'#ffffff',tx2:'#44546a',dk2:'#44546a',bg2:'#e7e6e6',lt2:'#e7e6e6'};return map[sch.getAttribute('val')]||fallback}
  return fallback;
}
function wdRunHtml(run){
  const rPr=wdChild(run,'w:rPr');let css='';
  if(rPr){
    const f=wdChild(rPr,'w:rFonts'),font=f&&(f.getAttribute('w:ascii')||f.getAttribute('w:hAnsi'));
    if(font)css+=`font-family:'${font.replace(/['"]/g,'')}','Times New Roman',serif;`;
    if(wdOn(rPr,'b'))css+='font-weight:700;';
    if(wdOn(rPr,'i'))css+='font-style:italic;';
    const deco=[],u=wdChild(rPr,'w:u');
    if(u&&u.getAttribute('w:val')!=='none')deco.push('underline');
    if(wdOn(rPr,'strike'))deco.push('line-through');
    if(deco.length)css+=`text-decoration:${deco.join(' ')};`;
    const sz=wdChild(rPr,'w:sz');if(sz)css+=`font-size:${Number(sz.getAttribute('w:val'))/2}pt;`;
    const col=wdChild(rPr,'w:color'),cv=col&&col.getAttribute('w:val');
    if(cv&&/^[0-9a-f]{6}$/i.test(cv))css+=`color:#${cv};`;
    const va=wdChild(rPr,'w:vertAlign'),v=va&&va.getAttribute('w:val');
    if(v==='superscript')css+='vertical-align:super;font-size:.65em;line-height:0;';
    if(v==='subscript')css+='vertical-align:sub;font-size:.65em;line-height:0;';
  }
  let inner='';
  for(const n of run.childNodes){
    if(n.nodeName==='w:t')inner+=escapeHtml(n.textContent);
    else if(n.nodeName==='w:tab')inner+='<span style="display:inline-block;width:2em"></span>';
    else if(n.nodeName==='w:br')inner+='<br>';
  }
  return inner?`<span style="${css}">${inner}</span>`:'';
}
function wdParaHtml(p){
  const pPr=wdChild(p,'w:pPr');let css='margin:0;white-space:pre-wrap;';
  const jc=wdChild(pPr,'w:jc'),j=jc&&jc.getAttribute('w:val');
  css+=`text-align:${j==='center'?'center':(j==='right'||j==='end')?'right':j==='both'?'justify':'left'};`;
  const sp=wdChild(pPr,'w:spacing');
  if(sp){
    const a=sp.getAttribute('w:after'),b=sp.getAttribute('w:before'),l=sp.getAttribute('w:line');
    if(b)css+=`margin-top:${b/20}pt;`;
    if(a)css+=`margin-bottom:${a/20}pt;`;
    if(l&&(sp.getAttribute('w:lineRule')||'auto')==='auto')css+=`line-height:${(l/240).toFixed(3)};`;
  }
  const ind=wdChild(pPr,'w:ind');
  if(ind){
    const g=n=>ind.getAttribute('w:'+n),L=g('left')||g('start'),R=g('right')||g('end'),F=g('firstLine'),H=g('hanging');
    if(L)css+=`margin-left:${L/20}pt;`;
    if(R)css+=`margin-right:${R/20}pt;`;
    if(F)css+=`text-indent:${F/20}pt;`;
    if(H)css+=`text-indent:-${H/20}pt;`;
  }
  let inner='';
  for(const c of p.children){
    if(c.nodeName==='w:r')inner+=wdRunHtml(c);
    else if(c.nodeName==='w:hyperlink'||c.nodeName==='w:smartTag'||c.nodeName==='w:ins')for(const r of c.children)if(r.nodeName==='w:r')inner+=wdRunHtml(r);
  }
  return `<p style="${css}">${inner||'&nbsp;'}</p>`;
}
// Word text boxes (wps / VML) are not supported by docx-preview. Each one is replaced in the XML by a small marker,
// and its text and geometry are kept so the box can be rebuilt after rendering.
async function wdPrepareDocx(buffer){
  const zip=await window.JSZip.loadAsync(buffer),entry=zip.file('word/document.xml');
  if(!entry)return {buffer,boxes:[]};
  const doc=new DOMParser().parseFromString(await entry.async('string'),'application/xml');
  if(doc.getElementsByTagName('parsererror').length)return {buffer,boxes:[]};
  const boxes=[];
  for(const ac of [...doc.getElementsByTagName('mc:AlternateContent')]){
    const choice=wdChild(ac,'mc:Choice'),anchor=choice&&choice.getElementsByTagName('wp:anchor')[0],tx=choice&&choice.getElementsByTagName('w:txbxContent')[0];
    if(!anchor||!tx)continue;
    const ext=anchor.getElementsByTagName('wp:extent')[0];
    if(!ext)continue;
    const pos=tag=>{const e=anchor.getElementsByTagName(tag)[0];if(!e)return {from:'paragraph',align:null,off:0};const al=wdChild(e,'wp:align'),po=wdChild(e,'wp:posOffset');return {from:e.getAttribute('relativeFrom'),align:al?al.textContent.trim():null,off:po?Number(po.textContent)/9525:0}};
    const spPr=choice.getElementsByTagName('wps:spPr')[0],ln=wdChild(spPr,'a:ln'),body=choice.getElementsByTagName('wps:bodyPr')[0];
    const hasLine=!!ln&&!wdChild(ln,'a:noFill'),color=wdColor(ln,'#000000');
    const ins=n=>body&&body.getAttribute(n)!==null?Number(body.getAttribute(n))/9525:(n==='lIns'||n==='rIns'?9.6:4.8);
    const paras=[...tx.children].filter(c=>c.nodeName==='w:p'),text=tx.textContent.replace(/\s+/g,'').length;
    boxes.push({w:Number(ext.getAttribute('cx'))/9525,h:Number(ext.getAttribute('cy'))/9525,H:pos('wp:positionH'),V:pos('wp:positionV'),
      lineW:hasLine?(ln.getAttribute('w')?Number(ln.getAttribute('w'))/9525:1.33):0,color,
      ins:{l:ins('lIns'),t:ins('tIns'),r:ins('rIns'),b:ins('bIns')},anchorV:body&&body.getAttribute('anchor')||'t',
      skip:!text&&(!hasLine||color.toLowerCase()==='#ffffff'),html:paras.map(wdParaHtml).join('')});
    const t=doc.createElementNS(WORD_NS,'w:t');t.setAttribute('xml:space','preserve');t.textContent=`[[${WORD_MARK}${boxes.length-1}]]`;
    const parent=ac.parentNode;
    if(parent.nodeName==='w:r')parent.replaceChild(t,ac);
    else{const r=doc.createElementNS(WORD_NS,'w:r');r.appendChild(t);parent.replaceChild(r,ac)}
  }
  if(!boxes.length)return {buffer,boxes};
  let xml=new XMLSerializer().serializeToString(doc);
  if(!xml.startsWith('<?xml'))xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'+xml;
  zip.file('word/document.xml',xml);
  return {buffer:await zip.generateAsync({type:'arraybuffer'}),boxes};
}
function wdPlaceBoxes(root,boxes){
  if(!boxes.length)return;
  const doc=root.ownerDocument,view=doc.defaultView,walker=doc.createTreeWalker(root,4),hits=[];
  let n;while((n=walker.nextNode()))if(n.nodeValue.indexOf('[['+WORD_MARK)>-1)hits.push(n);
  for(const node of hits){
    const re=new RegExp('\\[\\['+WORD_MARK+'(\\d+)\\]\\]','g'),found=[];let m;
    while((m=re.exec(node.nodeValue)))found.push(Number(m[1]));
    node.nodeValue=node.nodeValue.replace(re,'');
    const holder=node.parentElement;if(!holder)continue;
    const p=holder.closest('p')||holder,sec=p.closest('section.docx')||root;
    if(!p.textContent.replace(/\u200b/g,'').trim())p.appendChild(doc.createTextNode('\u00a0'));
    p.style.position='relative';
    const pr=p.getBoundingClientRect(),sr=sec.getBoundingClientRect(),sc=view.getComputedStyle(sec);
    const padL=parseFloat(sc.paddingLeft)||0,padR=parseFloat(sc.paddingRight)||0,padT=parseFloat(sc.paddingTop)||0;
    const marginLeft=sr.left+padL,contentW=sr.width-padL-padR;
    for(const idx of found){
      const b=boxes[idx];if(!b||b.skip)continue;
      const fromPage=b.H.from==='page',baseL=fromPage?sr.left:marginLeft,baseW=fromPage?sr.width:contentW;
      let x=baseL+b.H.off;
      if(b.H.align==='right')x=baseL+baseW-b.w;else if(b.H.align==='center')x=baseL+(baseW-b.w)/2;else if(b.H.align==='left')x=baseL;
      let y=pr.top+b.V.off;
      if(b.V.from==='page')y=sr.top+b.V.off;else if(b.V.from==='margin'||b.V.from==='topMargin')y=sr.top+padT+b.V.off;
      const d=doc.createElement('div');
      d.setAttribute('data-word-box','1');
      d.style.cssText=`position:absolute;z-index:2;box-sizing:border-box;left:${(x-pr.left).toFixed(2)}px;top:${(y-pr.top).toFixed(2)}px;width:${b.w.toFixed(2)}px;height:${b.h.toFixed(2)}px;`+
        `border:${b.lineW?b.lineW.toFixed(2)+'px solid '+b.color:'0'};background:#fff;color:#000;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.15;`+
        `padding:${b.ins.t}px ${b.ins.r}px ${b.ins.b}px ${b.ins.l}px;display:flex;flex-direction:column;justify-content:${b.anchorV==='ctr'?'center':b.anchorV==='b'?'flex-end':'flex-start'};overflow:visible;`;
      d.innerHTML=b.html;
      p.appendChild(d);
    }
  }
}
// Finds cut positions that never go through a text line, image or table row.
function wdPageCuts(page,rect,pageH,padT,padB){
  const doc=page.ownerDocument,range=doc.createRange(),walker=doc.createTreeWalker(page,4),boxes=[];
  let n;
  while((n=walker.nextNode())){
    if(!n.nodeValue.trim())continue;
    range.selectNodeContents(n);
    for(const r of range.getClientRects())if(r.height>0)boxes.push([r.top-rect.top,r.bottom-rect.top]);
  }
  page.querySelectorAll('img,svg,canvas,tr').forEach(e=>{const r=e.getBoundingClientRect();if(r.height>0)boxes.push([r.top-rect.top,r.bottom-rect.top])});
  const total=rect.height,segs=[];let start=0,first=true;
  while(true){
    const top=first?0:padT,room=pageH-top;
    if(total-start<=room+0.5){segs.push({from:start,to:total,top});break}
    const limit=start+room-padB;let cut=limit;
    for(let guard=0;guard<1000;guard++){
      const hit=boxes.find(b=>b[0]<cut-0.5&&b[1]>cut+0.5);
      if(!hit)break;
      cut=hit[0];
    }
    if(cut<=start+20)cut=limit; // one giant element: hard cut
    segs.push({from:start,to:cut,top});start=cut;first=false;
  }
  return segs;
}
// Adds an invisible text layer so the exported PDF can be searched and copied (Latin text; other scripts stay visible as image).
function wdAddTextLayer(pdf,page,pageRect,seg){
  try{
    const from=seg?seg.from:0,to=seg?seg.to:Infinity,top=seg?seg.top:0;
    const doc=page.ownerDocument,view=doc.defaultView,walker=doc.createTreeWalker(page,4),range=doc.createRange();
    const ok=/[\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/;
    let node;
    while((node=walker.nextNode())){
      const parent=node.parentElement;if(!parent||!node.nodeValue.trim())continue;
      const cs=view.getComputedStyle(parent),size=parseFloat(cs.fontSize)||16,bold=Number(cs.fontWeight)>=600||cs.fontWeight==='bold',italic=cs.fontStyle==='italic';
      pdf.setFont('times',bold&&italic?'bolditalic':bold?'bold':italic?'italic':'normal');pdf.setFontSize(size*0.75);
      const re=/\S+/g;let m;
      while((m=re.exec(node.nodeValue))){
        let word=m[0];const good=[...word].filter(c=>ok.test(c)).length;
        if(good<word.length/2)continue;
        word=[...word].map(c=>ok.test(c)?c:'?').join('');
        range.setStart(node,m.index);range.setEnd(node,m.index+m[0].length);
        const r=range.getClientRects()[0];if(!r||!r.width)continue;
        const mid=(r.top+r.bottom)/2-pageRect.top;
        if(mid<from||mid>=to)continue;
        pdf.text(word,(r.left-pageRect.left)*0.75,(r.bottom-pageRect.top-from+top-r.height*0.2)*0.75,{renderingMode:'invisible'});
      }
    }
  }catch(e){console.warn('Text layer skipped:',e)}
}
async function launchWordPdf(){
 openExtra('Word → PDF','Convert a DOCX document to PDF with the original page layout, text boxes, lists and images.',`<div class="extra-drop" id="wordPick"><strong>Choose a Word document (.docx)</strong><span>DOCX · Keeps page layout, headings, lists, text boxes and images.</span></div><div class="extra-result" id="wordName">No document selected.</div><button class="extra-action" id="wordGo" disabled>Convert to PDF</button><p class="extra-note">Fonts that are not installed on this device are replaced by similar ones, so line breaks can differ slightly from Word. English text stays selectable in the PDF; Bangla and other scripts are kept as an exact picture. SmartArt, equations and some Word-only effects may look different.</p>`);
 let file=null;
 const pick=extraBody.querySelector('#wordPick'),name=extraBody.querySelector('#wordName'),go=extraBody.querySelector('#wordGo');
 pick.onclick=async()=>{[file]=await chooseFile('.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document');if(file){name.textContent=`${file.name} · ${formatBytes(file.size)}`;go.disabled=false}};
 go.onclick=async()=>{
  if(!file)return;
  go.disabled=true;name.textContent='Preparing Word document…';
  let frame=null;
  try{
   await loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   if(!window.JSZip)throw new Error('JSZip library did not initialize. Please refresh the page and try again.');
   await loadLibrary('https://unpkg.com/docx-preview@0.3.6/dist/docx-preview.min.js',()=>!!(window.docx&&window.docx.renderAsync));
   await loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',()=>!!window.html2canvas);
   const jsPDF=await ensureJsPdf();
   const prepared=await wdPrepareDocx(await file.arrayBuffer());
   frame=document.createElement('iframe');
   frame.setAttribute('aria-hidden','true');
   frame.style.cssText='position:fixed;left:-12000px;top:0;width:1100px;height:1200px;border:0;background:#fff;pointer-events:none';
   document.body.appendChild(frame);
   const fd=frame.contentDocument;fd.open();fd.write(WORD_FRAME_HTML);fd.close();
   const root=fd.getElementById('docxRoot'),styleHost=fd.getElementById('docxStyles');
   name.textContent='Rendering document…';
   await window.docx.renderAsync(prepared.buffer,root,styleHost,{className:'docx',inWrapper:true,ignoreWidth:false,ignoreHeight:false,breakPages:true,ignoreLastRenderedPageBreak:false,experimental:true,renderHeaders:true,renderFooters:true,renderFootnotes:true,renderEndnotes:true});
   wdPlaceBoxes(root,prepared.boxes);
   if(fd.fonts&&fd.fonts.ready)await fd.fonts.ready;
   await Promise.all([...root.querySelectorAll('img')].map(img=>img.complete?null:new Promise(r=>{img.onload=img.onerror=r})));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const pages=[...root.querySelectorAll('section.docx')];
   if(!pages.length)throw new Error('The DOCX renderer did not find any pages. The document may contain unsupported content.');
   const firstRect=pages[0].getBoundingClientRect(),minH=parseFloat(frame.contentWindow.getComputedStyle(pages[0]).minHeight)||0;
   const pageW=firstRect.width,pageH=minH||firstRect.height,ptW=pageW*0.75,ptH=pageH*0.75;
   const dims=[Math.min(ptW,ptH),Math.max(ptW,ptH)],orient=ptW>ptH?'l':'p';
   const pdf=new jsPDF({unit:'pt',format:dims,orientation:orient,compress:true});
   let made=0;
   for(let i=0;i<pages.length;i++){
    const page=pages[i],rect=page.getBoundingClientRect();
    if(!rect.width||!rect.height)throw new Error(`Page ${i+1} could not be rendered.`);
    name.textContent=`Rendering page ${i+1} of ${pages.length}…`;
    const scale=2,canvas=await window.html2canvas(page,{backgroundColor:'#ffffff',scale,useCORS:true,allowTaint:false,logging:false});
    const pcs=frame.contentWindow.getComputedStyle(page),padT=parseFloat(pcs.paddingTop)||0,padB=parseFloat(pcs.paddingBottom)||0;
    const segs=rect.height>pageH*1.03?wdPageCuts(page,rect,pageH,padT,padB):[{from:0,to:rect.height,top:0}];
    for(let k=0;k<segs.length;k++){
     const s=segs[k];
     if(made>0)pdf.addPage(dims,orient);
     let source=canvas,heightPt=ptH;
     if(segs.length>1){
      const sy=Math.round(s.from*scale),sh=Math.max(1,Math.min(Math.round((s.to-s.from)*scale),canvas.height-sy));
      source=document.createElement('canvas');source.width=canvas.width;source.height=sh;
      const ctx=source.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,source.width,sh);
      ctx.drawImage(canvas,0,sy,canvas.width,sh,0,0,canvas.width,sh);
      heightPt=sh/scale*0.75;
     }
     pdf.addImage(source.toDataURL('image/jpeg',0.94),'JPEG',0,s.top*0.75,ptW,heightPt,undefined,'FAST');
     wdAddTextLayer(pdf,page,rect,segs.length>1?s:null);
     made++;
     if(source!==canvas){source.width=1;source.height=1}
    }
    canvas.width=1;canvas.height=1;
   }
   pdf.save(`${fileBase(file.name)}.pdf`);
   name.textContent=`PDF created successfully · ${made} page(s).`;
  }catch(e){
   console.error('Word to PDF conversion error:',e);
   const detail=e&&e.message?e.message:String(e||'Unknown error');
   name.textContent=`Conversion failed: ${detail}`;
   showToast(`Word conversion failed: ${detail}`);
  }finally{
   if(frame)frame.remove();
   go.disabled=false;
  }
 };
}

// PDF to Text — rebuilds lines from the position of every text piece, then (optionally) joins wrapped lines into paragraphs.
// <pdf-text-helpers>
function pdfPageLines(content,pageHeight){
  const frags=[];
  for(const it of content.items){
    if(typeof it.str!=='string'||!it.transform||!it.str.length)continue;
    const fs=Math.hypot(it.transform[2],it.transform[3])||it.height||10;
    frags.push({x:it.transform[4],y:it.transform[5],w:it.width||0,fs,str:it.str});
  }
  frags.sort((a,b)=>b.y-a.y);
  const groups=[];
  for(const f of frags){
    const g=groups[groups.length-1];
    if(g&&Math.abs(g.last-f.y)<=Math.max(1.5,Math.max(g.fs,f.fs)*0.45)){g.items.push(f);g.fs=Math.max(g.fs,f.fs);g.last=f.y}
    else groups.push({last:f.y,fs:f.fs,items:[f]});
  }
  for(const g of groups){const ys=g.items.map(f=>f.y).sort((a,b)=>a-b);g.y=ys[Math.floor(ys.length/2)]}
  const lines=[];
  for(const g of groups){
    g.items.sort((a,b)=>a.x-b.x);
    let text='',end=null,x0=g.items[0].x,hasTab=false;
    for(const f of g.items){
      if(end!==null){
        const gap=f.x-end;
        if(gap>g.fs*2.5){text=text.replace(/ +$/,'')+'\t';hasTab=true}
        else if(gap>g.fs*0.15&&!/\s$/.test(text)&&!/^\s/.test(f.str))text+=' ';
      }
      text+=f.str;end=Math.max(end===null?-Infinity:end,f.x+f.w);
    }
    text=text.replace(/[ \u00a0]+$/,'');
    if(!text.trim())continue;
    lines.push({y:g.y,x0,x1:end,fs:g.fs,text,hasTab});
  }
  // drop lone page numbers in the top/bottom margin
  const clean=lines.filter(l=>!(pageHeight&&(l.y<pageHeight*0.07||l.y>pageHeight*0.93)&&/^\s*(\d+|[ivxlcdm]+|page\s+\d+(\s+of\s+\d+)?)\s*$/i.test(l.text)));
  return clean;
}
// removes headers/footers that repeat on many pages (e.g. a running chapter title)
function pdfDropRunningLines(pages){
  if(pages.length<3)return;
  const key=l=>l.text.replace(/\d+/g,'#').trim().toLowerCase();
  const inZone=(pg,l)=>pg.height&&(l.y<pg.height*0.1||l.y>pg.height*0.9);
  const seen=new Map();
  for(const pg of pages){const keys=new Set();for(const l of pg.lines)if(inZone(pg,l))keys.add(key(l));for(const k of keys)seen.set(k,(seen.get(k)||0)+1)}
  const need=Math.max(3,Math.ceil(pages.length*0.4));
  for(const pg of pages)pg.lines=pg.lines.filter(l=>!(inZone(pg,l)&&seen.get(key(l))>=need));
}
function pdfLinesToText(pages,reflow){
  pdfDropRunningLines(pages);
  const bullet=/^[\uF000-\uF8FF\u2022\u25CF\u25AA\u25E6\u2023\u00B7\u2043\u25A0\u2751]\s*/;
  const listStart=/^(\u2022|[-\u2013\u2014*]\s|\d{1,3}[.)]\s|\(?[a-zA-Z]{1,2}[.)]\s|\(\d{1,3}\)\s|[IVX]{1,5}[.)]\s)/;
  const out=[];let cur=null,prev=null,prevShort=true;
  const push=(text,type,sep)=>{if(sep&&out.length&&out[out.length-1]!=='')out.push('');cur={type,idx:out.length};out.push(text)};
  for(const pg of pages){
    const L=pg.lines;if(!L.length)continue;
    const left=Math.min(...L.map(l=>l.x0));
    const rights=L.map(l=>l.x1).sort((a,b)=>a-b),right=rights[Math.floor(rights.length*0.9)]||rights[rights.length-1];
    const width=Math.max(1,right-left);
    const gaps=[];for(let i=1;i<L.length;i++){const g=L[i-1].y-L[i].y;if(g>0)gaps.push(g)}
    gaps.sort((a,b)=>a-b);const med=gaps.length?gaps[Math.floor(gaps.length/2)]:12;
    L.forEach((l,i)=>{
      const text=l.text.replace(bullet,'\u2022 ');
      const isItem=text.startsWith('\u2022 ')||listStart.test(text);
      const pw=pg.width||(left+right),centered=!l.hasTab&&Math.abs((l.x0+l.x1)/2-pw/2)<Math.max(l.fs,pw*0.025)&&!(l.x0<=left+l.fs*1.5&&l.x1>=right-l.fs*1.5);
      const type=l.hasTab?'row':isItem?'item':'text';
      const short=l.x1<right-width*0.12||l.hasTab;
      const first=i===0;
      const bigGap=!first&&(L[i-1].y-l.y)>med*1.45;
      if(!reflow){
        if(!first&&bigGap&&out[out.length-1]!=='')out.push('');
        if(first&&out.length&&out[out.length-1]!=='')out.push('');
        out.push(text);return;
      }
      const indented=cur&&cur.type==='text'&&l.x0>left+l.fs*1.5&&l.x0<left+width*0.25&&type==='text';
      let join=false;
      if(cur&&prev&&!bigGap&&!prevShort&&type==='text'&&!indented&&(cur.type==='text'||cur.type==='item')){
        join=first?(/^[a-z(]/.test(text)&&!pg.isFirst):true;
      }
      if(join){
        const last=out[cur.idx];
        out[cur.idx]=/[-\u2010]$/.test(last)&&/^[a-z]/.test(text)?last+text:last+' '+text;
      }else{
        const sep=bigGap||first||!cur||cur.type!==type||(prevShort&&!short);
        push(text,type,sep);
      }
      prev=l;prevShort=short;
    });
    if(!reflow&&out[out.length-1]!=='')out.push('');
  }
  while(out.length&&out[out.length-1]==='')out.pop();
  return out.join('\n').replace(/\n{3,}/g,'\n\n');
}
// </pdf-text-helpers>
async function launchPdfText(){
 openExtra('PDF → Text','Extract selectable text from a PDF with paragraphs, lists and line breaks kept as closely as possible.',`<div class="extra-drop" id="pdfTextPick"><strong>Choose a PDF file</strong><span>Text-based PDFs supported. Scanned pages need OCR, which is not included.</span></div><div class="extra-result" id="pdfTextName">No PDF selected.</div><label class="extra-field">Layout<select id="pdfTextLayout"><option value="paragraphs" selected>Paragraphs (wrapped lines joined)</option><option value="lines">Keep original line breaks</option></select></label><button class="extra-action" id="pdfTextGo" disabled>Extract Text</button><textarea id="pdfTextOutput" class="extra-field" placeholder="Extracted text will appear here…" readonly style="min-height:220px"></textarea><button class="extra-action" id="pdfTextSave" disabled>Download TXT</button>`);
 let file=null,output='';
 extraBody.querySelector('#pdfTextPick').onclick=async()=>{[file]=await chooseFile('application/pdf,.pdf');if(file){extraBody.querySelector('#pdfTextName').textContent=file.name;extraBody.querySelector('#pdfTextGo').disabled=false}};
 extraBody.querySelector('#pdfTextGo').onclick=async()=>{
  if(!file)return;
  const go=extraBody.querySelector('#pdfTextGo');go.disabled=true;
  try{
   const pdfjs=await ensurePdfJs(),pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise,pages=[];
   for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n),content=await page.getTextContent(),view=page.getViewport({scale:1});
    pages.push({lines:pdfPageLines(content,view.height),isFirst:n===1,width:view.width,height:view.height});
    extraBody.querySelector('#pdfTextName').textContent=`Reading page ${n} of ${pdf.numPages}…`;
   }
   output=pdfLinesToText(pages,extraBody.querySelector('#pdfTextLayout').value==='paragraphs');
   extraBody.querySelector('#pdfTextOutput').value=output||'No selectable text found. This may be a scanned PDF.';
   extraBody.querySelector('#pdfTextSave').disabled=!output;
   extraBody.querySelector('#pdfTextName').textContent=`Processed ${pdf.numPages} page(s).`;
  }catch(e){console.error(e);showToast('Could not read this PDF.')}
  go.disabled=false;
 };
 extraBody.querySelector('#pdfTextSave').onclick=()=>saveBlob(new Blob([output],{type:'text/plain;charset=utf-8'}),`${fileBase(file.name)}.txt`);
}

// PDF to Image
async function launchPdfImage(){
 openExtra('PDF → Image','Export every PDF page as a PNG or JPEG image.',`<div class="extra-drop" id="pdfImgPick"><strong>Choose a PDF file</strong><span>All pages will be rendered in your browser.</span></div><div class="extra-result" id="pdfImgName">No PDF selected.</div><div class="extra-row"><label class="extra-field">Image format<select id="pdfImgType"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></label><label class="extra-field">Scale<select id="pdfImgScale"><option value="1">Standard</option><option value="1.5" selected>High</option><option value="2">Very high</option></select></label></div><button class="extra-action" id="pdfImgGo" disabled>Convert Pages</button><div class="extra-result" id="pdfImgResult"></div>`);
 let file=null;extraBody.querySelector('#pdfImgPick').onclick=async()=>{[file]=await chooseFile('application/pdf,.pdf');if(file){extraBody.querySelector('#pdfImgName').textContent=file.name;extraBody.querySelector('#pdfImgGo').disabled=false}};
 extraBody.querySelector('#pdfImgGo').onclick=async()=>{const go=extraBody.querySelector('#pdfImgGo');go.disabled=true;try{const pdfjs=await ensurePdfJs(),pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise,type=extraBody.querySelector('#pdfImgType').value,scale=Number(extraBody.querySelector('#pdfImgScale').value);for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),viewport=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const blob=await canvasBlob(canvas,type,.92);saveBlob(blob,`${fileBase(file.name)}-page-${n}.${type==='image/png'?'png':'jpg'}`)}extraBody.querySelector('#pdfImgResult').textContent=`Exported ${pdf.numPages} page(s). Your browser may ask permission for multiple downloads.`}catch(e){console.error(e);showToast('Could not convert this PDF.')}go.disabled=false};
}

// QR Generator
async function launchQrGenerator(){
 openExtra('QR Generator','Create a downloadable QR code for a link or text.',`<label class="extra-field">Enter text or URL<textarea id="qrText" placeholder="https://example.com"></textarea></label><div class="extra-row"><label class="extra-field">Size<select id="qrSize"><option value="180">Small</option><option value="256" selected>Medium</option><option value="384">Large</option></select></label><label class="extra-field">Error correction<select id="qrLevel"><option value="L">Low</option><option value="M" selected>Medium</option><option value="Q">Quartile</option><option value="H">High</option></select></label></div><button class="extra-action" id="qrMake">Generate QR</button><div class="extra-qr" id="qrOutput"></div><button class="extra-action" id="qrDownload" disabled>Download PNG</button>`);
 extraBody.querySelector('#qrMake').onclick=async()=>{const text=extraBody.querySelector('#qrText').value.trim();if(!text){showToast('Enter some text or a URL first.');return}try{await loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',()=>!!window.QRCode);const out=extraBody.querySelector('#qrOutput');out.innerHTML='';const size=Number(extraBody.querySelector('#qrSize').value);new QRCode(out,{text,width:size,height:size,colorDark:'#111827',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel[extraBody.querySelector('#qrLevel').value]});setTimeout(()=>extraBody.querySelector('#qrDownload').disabled=false,100)}catch(e){showToast(e.message)}};
 extraBody.querySelector('#qrDownload').onclick=()=>{const out=extraBody.querySelector('#qrOutput'),img=out.querySelector('img'),canvas=out.querySelector('canvas');const url=img?.src||canvas?.toDataURL('image/png');if(url){const a=document.createElement('a');a.href=url;a.download='convertly-qr.png';a.click()}};
}

// QR Scanner — camera where supported, plus image upload.
async function launchQrScanner(){
 openExtra('QR Scanner','Scan a QR code from an image or use your camera.',`<div class="extra-row"><button class="extra-action" id="qrUpload">Scan Image</button><button class="extra-action" id="qrCamera">Use Camera</button><button class="extra-action" id="qrStop" disabled>Stop Camera</button></div><video id="qrVideo" playsinline hidden></video><canvas id="qrCanvas" hidden></canvas><div class="extra-result" id="qrScanResult">Scanned content will appear here.</div>`);
 const result=extraBody.querySelector('#qrScanResult'),video=extraBody.querySelector('#qrVideo'),stop=extraBody.querySelector('#qrStop');let stream=null,raf=0;extraCleanup.push(()=>{cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop())});
 async function decodeImage(file){try{if('BarcodeDetector'in window){const detector=new BarcodeDetector({formats:['qr_code']}),bitmap=await createImageBitmap(file),codes=await detector.detect(bitmap);result.textContent=codes[0]?.rawValue||'No QR code found in this image.';return}await loadLibrary('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',()=>!!window.jsQR);const img=await loadImage(file),c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,c.width,c.height),code=jsQR(d.data,d.width,d.height);result.textContent=code?.data||'No QR code found in this image.'}catch(e){result.textContent=e.message||'Could not scan this image.'}}
 extraBody.querySelector('#qrUpload').onclick=async()=>{const [f]=await chooseFile('image/*');if(f)decodeImage(f)};
 extraBody.querySelector('#qrCamera').onclick=async()=>{try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera is not available. Use HTTPS or localhost.');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});video.srcObject=stream;video.hidden=false;await video.play();stop.disabled=false;const canvas=extraBody.querySelector('#qrCanvas'),ctx=canvas.getContext('2d');const scan=async()=>{if(!stream)return; if(video.readyState>=2){canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);try{let value='';if('BarcodeDetector'in window){const detector=new BarcodeDetector({formats:['qr_code']}),codes=await detector.detect(video);value=codes[0]?.rawValue||''}else{await loadLibrary('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',()=>!!window.jsQR);const d=ctx.getImageData(0,0,canvas.width,canvas.height);value=jsQR(d.data,d.width,d.height)?.data||''}if(value){result.textContent=value;stopCamera();return}}catch(e){console.warn(e)}}raf=requestAnimationFrame(scan)};scan()}catch(e){result.textContent=e.message||'Could not access camera.'}};
 function stopCamera(){cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;video.hidden=true;stop.disabled=true}
 stop.onclick=stopCamera;
}

const toolLaunchers={
 'Image Converter':()=>openConverter(), 'Image Compressor':launchCompressor,'Image Resizer':launchResizer,
 'Image to PDF':launchImagePdf,'Batch Converter':launchBatch,'Word to PDF':launchWordPdf,
 'PDF to Text':launchPdfText,'PDF to Image':launchPdfImage,'QR Generator':launchQrGenerator,'QR Scanner':launchQrScanner
};
document.querySelectorAll('.tool-card').forEach(card=>card.addEventListener('click',()=>{const launch=toolLaunchers[card.dataset.tool];if(launch)Promise.resolve().then(launch).catch(e=>{console.error(e);showToast(e.message||'This tool could not be opened.')})}));
