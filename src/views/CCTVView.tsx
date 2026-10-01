import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Grid,
  Maximize2,
  Camera,
  RefreshCw,
  ExternalLink,
  Plus,
  Play,
  Pause,
  AlertCircle,
  Sliders,
  Check,
  Disc,
  HelpCircle,
  Server,
  Network,
  Shield,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  ArrowRight,
  Info,
  Tv,
  Wifi,
  Lock,
} from 'lucide-react';
import { storage } from '../services/storage';
import { CCTVCamera, CCTVZone } from '../types';

interface CCTVViewProps {
  onAttachSnapshotToOccurrence?: (snapshotUrl: string, cameraName: string) => void;
}

export const CCTVView: React.FC<CCTVViewProps> = ({ onAttachSnapshotToOccurrence }) => {
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState<'1x1' | '2x2' | '3x3'>('2x2');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState('');
  const [isRecording, setIsRecording] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CCTVCamera | null>(null);
  const [cameraToDelete, setCameraToDelete] = useState<CCTVCamera | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<{ url: string; cam: CCTVCamera } | null>(null);

  // Form State for Add / Edit Camera
  const [formMode, setFormMode] = useState<'wizard_intelbras' | 'custom_url'>('wizard_intelbras');
  const [camName, setCamName] = useState('');
  const [camZone, setCamZone] = useState<CCTVZone>('portao_veicular');
  const [camLocation, setCamLocation] = useState('');
  const [camBrand, setCamBrand] = useState('Intelbras Multi-HD');

  // DVR Wizard specific fields
  const [dvrHost, setDvrHost] = useState(''); // e.g. meucondominio.ddns-intelbras.com.br or 192.168.1.108
  const [dvrHttpPort, setDvrHttpPort] = useState('8080');
  const [dvrRtspPort, setDvrRtspPort] = useState('554');
  const [dvrChannel, setDvrChannel] = useState(1);
  const [dvrUser, setDvrUser] = useState('admin');
  const [dvrPass, setDvrPass] = useState('');
  const [dvrStreamMode, setDvrStreamMode] = useState<'snapshot_refresh' | 'stream_video' | 'external_web'>('snapshot_refresh');
  const [subStream, setSubStream] = useState(true);

  // Custom Stream fields
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [customRtspUrl, setCustomRtspUrl] = useState('');
  const [customExternalUrl, setCustomExternalUrl] = useState('');
  const [previewSampleImage, setPreviewSampleImage] = useState<string>('');

  // Toast Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Live Auto-Refresh Tick (updates DDNS camera feeds smoothly)
  const [liveTick, setLiveTick] = useState(Date.now());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
    latencyMs?: number;
    troubleshooting?: string[];
  } | null>(null);

  // Resolve camera stream URL through HTTPS proxy to bypass mixed content & CORS
  const resolveCameraStreamUrl = (cam: CCTVCamera, tick: number): string => {
    if (!cam) return '/src/assets/images/cctv_entrance_gate_1790763519317.jpg';

    // If native video stream (.mp4 or .m3u8), return streamUrl
    if (cam.streamUrl && (cam.streamUrl.endsWith('.m3u8') || cam.streamUrl.endsWith('.mp4'))) {
      return cam.streamUrl;
    }

    // If camera is bound to a DVR Host / DDNS
    const host = cam.dvrHost || cam.ipAddress;
    if (host && (host.includes('.') || host.includes('ddns') || host.includes('intelbras') || host.includes(':'))) {
      const channel = cam.dvrChannel || 1;
      const port = '8080';
      return `/api/cctv/snapshot?host=${encodeURIComponent(host)}&channel=${channel}&port=${port}&t=${tick}`;
    }

    // If snapshotUrl is HTTP (would trigger browser mixed-content block on HTTPS)
    if (cam.snapshotUrl?.startsWith('http://')) {
      return `/api/cctv/snapshot?url=${encodeURIComponent(cam.snapshotUrl)}&t=${tick}`;
    }

    return cam.snapshotUrl || '/src/assets/images/cctv_entrance_gate_1790763519317.jpg';
  };

  const handleTestConnection = async () => {
    if (!dvrHost.trim()) {
      triggerFeedback('Informe o endereço DDNS ou IP do DVR para testar.', 'info');
      return;
    }
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/cctv/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: dvrHost.trim(),
          port: dvrHttpPort.trim() || '8080',
          channel: dvrChannel || 1,
          user: dvrUser.trim() || 'admin',
          pass: dvrPass.trim(),
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.ok) {
        triggerFeedback('Conexão com DVR Intelbras bem-sucedida!');
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: 'Erro de comunicação com o servidor de proxy: ' + err.message,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const refreshCameras = () => {
    const list = storage.getCCTVCameras();
    setCameras(list);
    if (!selectedCameraId && list.length > 0) {
      setSelectedCameraId(list[0].id);
    }
  };

  useEffect(() => {
    refreshCameras();
    const unsub = storage.subscribe(refreshCameras);

    const timer = setInterval(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setCurrentTime(
        `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      );
    }, 1000);

    // Refresh live camera frames periodically
    const feedTimer = setInterval(() => {
      setLiveTick(Date.now());
    }, 3500);

    return () => {
      unsub();
      clearInterval(timer);
      clearInterval(feedTimer);
    };
  }, []);

  const triggerFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const filteredCameras = cameras.filter((cam) => {
    if (filterZone === 'all') return true;
    return cam.zone === filterZone;
  });

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  const handleCaptureSnapshot = (cam: CCTVCamera) => {
    const snapshotUrl =
      cam.snapshotUrl ||
      cam.streamUrl ||
      '/src/assets/images/cctv_entrance_gate_1790763519317.jpg';
    setCapturedSnapshot({ url: snapshotUrl, cam });
    storage.addAuditLog(
      'Snapshot CFTV Capturado',
      'Segurança',
      `Captura de evidência da câmera "${cam.name}" realizada na portaria.`
    );
  };

  const handleOpenAddModal = () => {
    setEditingCamera(null);
    setCamName(`CAM-${String(cameras.length + 1).padStart(2, '0')}: `);
    setCamZone('portao_veicular');
    setCamLocation('');
    setCamBrand('Intelbras Multi-HD');
    setDvrHost('meucondominio.ddns-intelbras.com.br');
    setDvrHttpPort('8080');
    setDvrRtspPort('554');
    setDvrChannel(cameras.length + 1);
    setDvrUser('admin');
    setDvrPass('');
    setDvrStreamMode('snapshot_refresh');
    setSubStream(true);
    setCustomStreamUrl('');
    setCustomRtspUrl('');
    setCustomExternalUrl('');
    setFormMode('wizard_intelbras');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cam: CCTVCamera) => {
    setEditingCamera(cam);
    setCamName(cam.name);
    setCamZone(cam.zone);
    setCamLocation(cam.location);
    setCamBrand(cam.brand);
    setCustomStreamUrl(cam.streamUrl || '');
    setCustomRtspUrl(cam.rtspUrl || '');
    setCustomExternalUrl(cam.externalViewerUrl || '');
    setDvrHost(cam.dvrHost || cam.ipAddress || '');
    setDvrChannel(cam.dvrChannel || 1);
    setFormMode(cam.dvrHost ? 'wizard_intelbras' : 'custom_url');
    setShowAddModal(true);
  };

  const handleSaveCamera = (e: React.FormEvent) => {
    e.preventDefault();

    if (!camName.trim() || !camLocation.trim()) {
      triggerFeedback('Preencha o nome e a localização da câmera.', 'info');
      return;
    }

    let finalSnapshotUrl = '';
    let finalStreamUrl = '';
    let finalRtspUrl = '';
    let finalExternalUrl = '';
    let finalFeedType: CCTVCamera['feedType'] = 'simulated_live';

    if (formMode === 'wizard_intelbras') {
      const cleanHost = dvrHost.trim().replace(/^https?:\/\//, '');
      const auth = dvrPass ? `${dvrUser}:${dvrPass}@` : `${dvrUser}@`;
      const streamSubtype = subStream ? 1 : 0;

      // Intelbras RTSP Pattern:
      finalRtspUrl = `rtsp://${auth}${cleanHost}:${dvrRtspPort}/cam/realmonitor?channel=${dvrChannel}&subtype=${streamSubtype}`;
      
      // Intelbras HTTP Snapshot CGI Pattern:
      finalSnapshotUrl = `http://${auth}${cleanHost}:${dvrHttpPort}/cgi-bin/snapshot.cgi?channel=${dvrChannel}`;
      
      // Direct DVR Web Interface:
      finalExternalUrl = `http://${cleanHost}:${dvrHttpPort}`;

      if (dvrStreamMode === 'snapshot_refresh') {
        finalFeedType = 'mjpeg_stream';
      } else if (dvrStreamMode === 'stream_video') {
        finalFeedType = 'hls_stream';
        finalStreamUrl = customStreamUrl || `http://${cleanHost}:1984/api/stream.m3u8?src=ch${dvrChannel}`;
      } else {
        finalFeedType = 'external_dvr';
      }
    } else {
      finalStreamUrl = customStreamUrl.trim();
      finalRtspUrl = customRtspUrl.trim();
      finalExternalUrl = customExternalUrl.trim();
      finalSnapshotUrl = customStreamUrl.trim() || '/src/assets/images/cctv_entrance_gate_1790763519317.jpg';
      finalFeedType = customStreamUrl.includes('.m3u8') || customStreamUrl.includes('.mp4') ? 'hls_stream' : 'simulated_live';
    }

    // Default sample image if nothing provided so the user gets immediate visual confirmation
    if (!finalSnapshotUrl && !finalStreamUrl) {
      finalSnapshotUrl = '/src/assets/images/cctv_entrance_gate_1790763519317.jpg';
    }

    const cameraData: CCTVCamera = {
      id: editingCamera ? editingCamera.id : `cam-${Date.now()}`,
      name: camName.trim(),
      zone: camZone,
      location: camLocation.trim(),
      status: 'online',
      brand: camBrand.trim() || 'Intelbras Multi-HD',
      ipAddress: dvrHost.trim() || '192.168.1.108',
      resolution: '1080p Full HD (30 FPS)',
      recordingRefPrefix: `DVR_CH${String(dvrChannel).padStart(2, '0')}`,
      feedType: finalFeedType,
      snapshotUrl: finalSnapshotUrl,
      streamUrl: finalStreamUrl || undefined,
      rtspUrl: finalRtspUrl || undefined,
      externalViewerUrl: finalExternalUrl || undefined,
      dvrChannel: Number(dvrChannel) || 1,
      dvrHost: dvrHost.trim() || undefined,
      subStream,
    };

    storage.saveCCTVCamera(cameraData);
    setShowAddModal(false);
    triggerFeedback(
      editingCamera
        ? `Câmera "${cameraData.name}" atualizada com sucesso!`
        : `Câmera "${cameraData.name}" vinculada ao Canal ${dvrChannel} com sucesso!`
    );
  };

  const handleDeleteCamera = () => {
    if (!cameraToDelete) return;
    storage.deleteCCTVCamera(cameraToDelete.id);
    if (selectedCameraId === cameraToDelete.id) {
      setSelectedCameraId(null);
    }
    setCameraToDelete(null);
    triggerFeedback('Câmera removida do sistema.');
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerFeedback(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Layout Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg w-full min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Video className="w-5 h-5 text-sky-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">Central de CFTV & Monitoramento</h2>
            <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded font-mono font-semibold shrink-0">
              DVR CONECTADO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mosaico ao vivo de portões, cancelas e garagens compatível com DVR Intelbras, DDNS, RTSP e WebRTC.
          </p>
        </div>

        {/* Action Buttons & Helpers */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Guide Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Como Ligar o DVR</span>
          </button>

          {/* Zone filter */}
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none flex-1 sm:flex-initial min-w-[130px]"
          >
            <option value="all">Todas as Áreas ({cameras.length})</option>
            <option value="portao_veicular">Portão Veicular</option>
            <option value="portao_social">Portão Social / Eclusa</option>
            <option value="garagem_subsolo">Garagem Subsolo</option>
            <option value="hall_torre_a">Hall Torre A</option>
            <option value="hall_torre_b">Hall Torre B</option>
            <option value="perimetro">Perímetro / Muros</option>
            <option value="area_lazer">Área de Lazer</option>
          </select>

          {/* Grid buttons */}
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl gap-0.5 shrink-0">
            <button
              onClick={() => setGridLayout('1x1')}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                gridLayout === '1x1' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              1
            </button>
            <button
              onClick={() => setGridLayout('2x2')}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                gridLayout === '2x2' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              4
            </button>
            <button
              onClick={() => setGridLayout('3x3')}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                gridLayout === '3x3' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({cameras.length})
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Canal de DVR</span>
          </button>
        </div>
      </div>

      {/* QUICK INSTRUCTIONS CALLOUT: Como adicionar as câmeras do DVR */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-800/50 rounded-xl p-3 sm:p-4 text-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-900/40 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-sky-500/20 text-sky-400 rounded-lg">
              <Tv className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-xs">
              Como Funciona a Conexão com seu DVR Intelbras / Hikvision
            </span>
          </div>
          <button
            onClick={() => setShowGuideModal(true)}
            className="text-[11px] text-sky-300 hover:text-sky-200 underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Ver passo a passo detalhado</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
          <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">1. Endereço do DVR:</strong>
            Use o IP local da portaria (<span className="text-amber-300 font-mono">192.168.1.108</span>) ou o DDNS Intelbras gratuito (<span className="text-sky-300 font-mono">condominio.ddns-intelbras.com.br</span>).
          </div>
          <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">2. Porta HTTP (8080 ou 80):</strong>
            O app requisita o snapshot direto do DVR via CGI sem precisar de plugins. Cada câmera é um canal (ex: Canal 1 = Portão, Canal 2 = Social).
          </div>
          <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">3. Web DVR e RTSP (554):</strong>
            Você pode abrir o WebViewer do DVR em 1 clique ou usar conversor de vídeo contínuo em 30 FPS.
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1x1 FOCUS VIEW                                               */}
      {/* ============================================================ */}
      {gridLayout === '1x1' && selectedCamera ? (
        <div className="space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 aspect-video shadow-2xl flex items-center justify-center group">
            {/* Live Video player if streamUrl or simulated HTML5 player */}
            {selectedCamera.streamUrl ? (
              <video
                src={selectedCamera.streamUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={resolveCameraStreamUrl(selectedCamera, liveTick)}
                alt={selectedCamera.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Live Security HUD Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 border border-emerald-950">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold">LIVE REC</span>
              <span>·</span>
              <span className="text-white font-semibold">{selectedCamera.name}</span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 border border-slate-800">
              <span>{currentTime}</span>
              <span className="text-sky-400 font-semibold">{selectedCamera.resolution}</span>
            </div>

            {/* Desktop in-video Bottom HUD */}
            <div className="hidden sm:flex absolute bottom-4 left-4 bg-black/85 backdrop-blur px-3 py-2 rounded-xl text-xs text-slate-300 border border-slate-800/80 flex-wrap items-center gap-2 max-w-[60%]">
              <span>Local: <strong className="text-white">{selectedCamera.location}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Host/IP: <span className="font-mono text-amber-300">{selectedCamera.dvrHost || selectedCamera.ipAddress}</span></span>
              <span className="text-slate-600">|</span>
              <span>Canal: <span className="font-mono text-sky-300 font-bold">CH {selectedCamera.dvrChannel || 1}</span></span>
              {selectedCamera.subStream && (
                <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-400 rounded">
                  Sub-Stream
                </span>
              )}
            </div>

            {/* Desktop Floating Action Buttons */}
            <div className="hidden sm:flex absolute bottom-4 right-4 items-center gap-2">
              <button
                onClick={() => handleCaptureSnapshot(selectedCamera)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl border border-slate-700 shadow-xl transition-colors cursor-pointer"
                title="Capturar Foto / Evidência"
              >
                <Camera className="w-4 h-4 text-sky-300" />
                <span>Capturar Imagem</span>
              </button>

              <button
                onClick={() => handleOpenEditModal(selectedCamera)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shadow transition-colors cursor-pointer"
                title="Configurar Parâmetros de DVR"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                <span>Editar Canal</span>
              </button>

              {selectedCamera.externalViewerUrl && (
                <a
                  href={selectedCamera.externalViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl border border-indigo-400/50 shadow transition-colors cursor-pointer"
                  title="Abrir no WebViewer do DVR Intelbras"
                >
                  <ExternalLink className="w-4 h-4 text-amber-300" />
                  <span>Abrir Web DVR</span>
                </a>
              )}
            </div>
          </div>

          {/* Mobile Under-Video Dedicated Control Bar */}
          <div className="sm:hidden bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="truncate mr-2">
                <span className="font-semibold text-white block truncate">{selectedCamera.name}</span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {selectedCamera.location} · Canal {selectedCamera.dvrChannel || 1}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded shrink-0">
                AO VIVO
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCaptureSnapshot(selectedCamera)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-sky-200" />
                <span>Capturar Foto</span>
              </button>

              <button
                onClick={() => handleOpenEditModal(selectedCamera)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-300" />
                <span>Editar DVR</span>
              </button>

              {selectedCamera.externalViewerUrl && (
                <a
                  href={selectedCamera.externalViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-amber-300" />
                  <span>Abrir Web DVR Intelbras</span>
                </a>
              )}
            </div>
          </div>

          {/* Camera Selector Strip Below */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {cameras.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCameraId(c.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedCameraId === c.id
                    ? 'border-sky-500 bg-sky-950/50 text-white shadow-lg'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-sky-400 font-bold">CH {c.dvrChannel || 1}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-xs font-semibold truncate mt-0.5 text-white">{c.name.split(':')[0]}</p>
                <p className="text-[10px] text-slate-400 truncate">{c.location}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* MOSAIC GRID LAYOUT (4 ou 9 CÂMERAS)                          */
        /* ============================================================ */
        <div
          className={`grid gap-4 ${
            gridLayout === '2x2' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {filteredCameras.map((cam) => (
            <div
              key={cam.id}
              className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between hover:border-sky-500/70 transition-all shadow-lg"
            >
              {cam.streamUrl ? (
                <video
                  src={cam.streamUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={resolveCameraStreamUrl(cam, liveTick)}
                  alt={cam.name}
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/cctv_entrance_gate_1790763519317.jpg';
                  }}
                />
              )}

              {/* Header HUD */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold">{cam.name.split(':')[0]}</span>
                <span className="text-slate-400">| CH {cam.dvrChannel || 1}</span>
              </div>

              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="bg-black/80 backdrop-blur text-[10px] font-mono text-slate-300 px-2 py-0.5 rounded-lg">
                  {currentTime.slice(11)}
                </span>
                <button
                  onClick={() => {
                    setSelectedCameraId(cam.id);
                    setGridLayout('1x1');
                  }}
                  className="bg-black/80 hover:bg-sky-600 text-slate-300 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Ampliar em tela única"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom footer & actions */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 flex items-end justify-between">
                <div className="truncate mr-2">
                  <p className="text-xs font-semibold text-white truncate">{cam.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {cam.location} · {cam.brand}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCaptureSnapshot(cam)}
                    className="p-1.5 bg-slate-900/90 hover:bg-sky-600 text-sky-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    title="Capturar Foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(cam)}
                    className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    title="Configurar Câmera"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {cam.externalViewerUrl && (
                    <a
                      href={cam.externalViewerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-900/90 hover:bg-indigo-600 text-amber-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                      title="Abrir no DVR do Condomínio"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: GUIA COMPLETO DE CONEXÃO COM DVR INTELBRAS           */}
      {/* ============================================================ */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Como Adicionar e Conectar as Câmeras de um DVR Intelbras
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Guia técnico passo a passo para colocar as imagens funcionando no app
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-300">
              {/* Step 1 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Obter o DDNS Intelbras ou IP do DVR</span>
                </div>
                <p className="leading-relaxed">
                  No DVR Intelbras (MHDX ou Multi-HD), acesse o menu com monitor/mouse:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200">
                  Menu Principal &gt; Rede &gt; DDNS &gt; Habilitar "DDNS Intelbras"
                </div>
                <p className="text-[11px] text-slate-400">
                  Exemplo de domínio gerado: <strong className="text-amber-300">meucondominio.ddns-intelbras.com.br</strong> (ou use o IP local <strong className="text-slate-200">192.168.1.108</strong> se o PC da portaria estiver no mesmo roteador).
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-sky-950 border border-sky-700 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Portas Necessárias no Roteador / Port Forwarding</span>
                </div>
                <p className="leading-relaxed">
                  Para acesso via internet, verifique se as portas estão liberadas no roteador:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block">Porta HTTP:</span>
                    <span className="text-white font-bold">8080 ou 80</span>
                    <span className="text-[10px] text-slate-500 block">Visualização Web & CGI</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block">Porta RTSP:</span>
                    <span className="text-white font-bold">554</span>
                    <span className="text-[10px] text-slate-500 block">Vídeo ao vivo H.264</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block">Porta Serviço:</span>
                    <span className="text-white font-bold">37777</span>
                    <span className="text-[10px] text-slate-500 block">Software Intelbras SIM Next</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Formatos de Conexão no Navegador (Como Funciona)</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">Opção A: Snapshot Automático (Funciona direto no navegador)</span>
                    <p className="text-[11px] text-slate-400">
                      O app requisita a imagem instantânea de cada canal pela API HTTP do DVR Intelbras:
                    </p>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded font-mono text-[11px] text-emerald-300">
                      <span>http://admin:senha@host:8080/cgi-bin/snapshot.cgi?channel=1</span>
                      <button
                        onClick={() =>
                          handleCopyText(
                            'http://admin:senha@host:8080/cgi-bin/snapshot.cgi?channel=1',
                            'URL Snapshot'
                          )
                        }
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">Opção B: Vídeo Contínuo 30 FPS (HLS / WebRTC com go2rtc)</span>
                    <p className="text-[11px] text-slate-400">
                      Navegadores modernos não leem RTSP puro por segurança. Para ter vídeo contínuo em 30 FPS, basta rodar o conversor gratuito <strong>go2rtc</strong> ou <strong>MediaMTX</strong> no PC da portaria. Ele lê o RTSP do DVR e gera a URL HLS (.m3u8):
                    </p>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded font-mono text-[11px] text-sky-300">
                      <span>rtsp://admin:senha@host:554/cam/realmonitor?channel=1&subtype=1</span>
                      <button
                        onClick={() =>
                          handleCopyText(
                            'rtsp://admin:senha@host:554/cam/realmonitor?channel=1&subtype=1',
                            'URL RTSP'
                          )
                        }
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">Opção C: WebViewer do DVR Intelbras com 1 Clique</span>
                    <p className="text-[11px] text-slate-400">
                      Ao cadastrar o DDNS e porta 8080, os porteiros podem abrir a interface nativa do DVR em tela cheia com 1 clique no botão "Abrir Web DVR".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => {
                  setShowGuideModal(false);
                  handleOpenAddModal();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <span>Entendi, quero Adicionar uma Câmera agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADICIONAR / EDITAR CÂMERA DE DVR                     */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCamera}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-scaleUp"
          >
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 border border-sky-500/30 rounded-xl text-sky-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingCamera ? `Editar ${editingCamera.name}` : 'Adicionar Canal de Câmera do DVR'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Vincule o canal do DVR Intelbras, configure o DDNS e o modo de exibição
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Mode Switcher */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormMode('wizard_intelbras')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    formMode === 'wizard_intelbras'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Assistente Intelbras / DVR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormMode('custom_url')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    formMode === 'custom_url'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>URL Manual / RTSP / HLS</span>
                </button>
              </div>

              {/* General Camera Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Nome da Câmera * <span className="text-slate-500 font-normal">(Ex: CAM 01 - Portão de Entrada)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CAM-01: Portão Veicular & Cancelas"
                    value={camName}
                    onChange={(e) => setCamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Área / Zona *</label>
                  <select
                    value={camZone}
                    onChange={(e) => setCamZone(e.target.value as CCTVZone)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="portao_veicular">Portão Veicular</option>
                    <option value="portao_social">Portão Social / Eclusa</option>
                    <option value="garagem_subsolo">Garagem Subsolo</option>
                    <option value="hall_torre_a">Hall Torre A</option>
                    <option value="hall_torre_b">Hall Torre B</option>
                    <option value="perimetro">Perímetro / Muro</option>
                    <option value="area_lazer">Área de Lazer / Salão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Localização Física *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Entrada principal da alameda"
                    value={camLocation}
                    onChange={(e) => setCamLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* SECTION: WIZARD INTELBRAS */}
              {formMode === 'wizard_intelbras' ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tv className="w-4 h-4" />
                      <span>Configurações do DVR Intelbras</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Compatível Multi-HD e MHDX</span>
                  </div>

                  {/* Quick DVR Presets Strip */}
                  <div className="space-y-1.5 pb-1">
                    <span className="text-[11px] font-semibold text-slate-300 block">Preenchimento com 1 Clique (Modelos Comuns):</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setDvrHost('meucondominio.ddns-intelbras.com.br');
                          setDvrHttpPort('8080');
                          setDvrRtspPort('554');
                          setDvrUser('admin');
                          setCamBrand('Intelbras Multi-HD');
                          setDvrStreamMode('snapshot_refresh');
                          triggerFeedback('Preenchido com padrão DDNS Intelbras!');
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-amber-300 transition-colors cursor-pointer"
                      >
                        Intelbras DDNS (Padrão)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDvrHost('192.168.1.108');
                          setDvrHttpPort('80');
                          setDvrRtspPort('554');
                          setDvrUser('admin');
                          setCamBrand('Intelbras MHDX');
                          setDvrStreamMode('snapshot_refresh');
                          triggerFeedback('Preenchido com IP de Rede Local!');
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-sky-300 transition-colors cursor-pointer"
                      >
                        Rede Local (IP 192.168.x)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDvrHost('condo-cameras.ddns.net');
                          setDvrHttpPort('8000');
                          setDvrRtspPort('554');
                          setDvrUser('admin');
                          setCamBrand('Hikvision / Dahua');
                          setDvrStreamMode('snapshot_refresh');
                          triggerFeedback('Preenchido com padrão Hikvision/Dahua!');
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-purple-300 transition-colors cursor-pointer"
                      >
                        Hikvision / Dahua
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-medium mb-1">
                        Endereço do DVR (DDNS Intelbras ou IP Local) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: meucondominio.ddns-intelbras.com.br ou 192.168.1.108"
                        value={dvrHost}
                        onChange={(e) => setDvrHost(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Canal do DVR (1 a 32) *</label>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        required
                        value={dvrChannel}
                        onChange={(e) => setDvrChannel(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Porta HTTP (CGI / Web)</label>
                      <input
                        type="text"
                        value={dvrHttpPort}
                        onChange={(e) => setDvrHttpPort(e.target.value)}
                        placeholder="8080 ou 80"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Usuário do DVR</label>
                      <input
                        type="text"
                        value={dvrUser}
                        onChange={(e) => setDvrUser(e.target.value)}
                        placeholder="admin"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Senha do DVR</label>
                      <input
                        type="password"
                        value={dvrPass}
                        onChange={(e) => setDvrPass(e.target.value)}
                        placeholder="Senha do DVR"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-900">
                      <label className="block text-slate-300 font-medium mb-1">Modo de Exibição no App:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDvrStreamMode('snapshot_refresh')}
                          className={`p-2.5 rounded-lg border text-left transition-colors ${
                            dvrStreamMode === 'snapshot_refresh'
                              ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          <span className="font-bold block text-xs">📸 Auto-Refresh Snapshot (CGI)</span>
                          <span className="text-[10px] text-slate-400">Funciona direto no navegador sem instalar nada</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDvrStreamMode('stream_video')}
                          className={`p-2.5 rounded-lg border text-left transition-colors ${
                            dvrStreamMode === 'stream_video'
                              ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          <span className="font-bold block text-xs">🎥 Stream de Vídeo HLS / WebRTC</span>
                          <span className="text-[10px] text-slate-400">Vídeo a 30 FPS contínuo via conversor</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* URL Generated Preview */}
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold block">URL RTSP Gerada para o Canal {dvrChannel}:</span>
                    <span className="text-[11px] font-mono text-amber-300 break-all select-all">
                      rtsp://{dvrUser}:{dvrPass ? '••••••' : '[senha]'}@{dvrHost || '[host]'}:{dvrRtspPort}/cam/realmonitor?channel={dvrChannel}&subtype={subStream ? 1 : 0}
                    </span>
                  </div>

                  {/* Interactive Realtime DDNS Connection Tester */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-sky-900/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-white block">Diagnóstico de Conexão com o DVR</span>
                        <span className="text-[10px] text-slate-400">Testa a resposta real do DDNS Intelbras e da porta HTTP</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow self-start sm:self-auto shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                        <span>{isTestingConnection ? 'Testando Conexão...' : 'Testar DDNS Intelbras'}</span>
                      </button>
                    </div>

                    {testResult && (
                      <div className={`p-3 rounded-lg border text-xs space-y-1.5 animate-fadeIn ${
                        testResult.ok
                          ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-700 text-rose-200'
                      }`}>
                        <div className="flex items-center gap-2 font-bold">
                          {testResult.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>{testResult.ok ? 'Sucesso! Câmera conectada e respondendo.' : 'Aviso na Conexão com o DVR'}</span>
                          {testResult.latencyMs && (
                            <span className="text-[10px] font-mono bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-300 ml-auto">
                              {testResult.latencyMs}ms
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] leading-relaxed">
                          {testResult.ok ? testResult.message : testResult.error}
                        </p>

                        {testResult.troubleshooting && (
                          <div className="pt-1.5 border-t border-rose-900/60 space-y-1">
                            <span className="text-[10px] font-bold text-rose-300 block">Dicas para fazer funcionar:</span>
                            <ul className="list-disc list-inside text-[10px] text-slate-300 space-y-0.5">
                              {testResult.troubleshooting.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SECTION: MANUAL URLS */
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      URL de Transmissão de Vídeo (HLS .m3u8, WebRTC ou MP4)
                    </label>
                    <input
                      type="url"
                      placeholder="http://192.168.1.100:1984/api/stream.m3u8?src=cam1"
                      value={customStreamUrl}
                      onChange={(e) => setCustomStreamUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">URL RTSP da Câmera (Opcional)</label>
                    <input
                      type="text"
                      placeholder="rtsp://admin:senha@192.168.1.108:554/cam/realmonitor?channel=1&subtype=1"
                      value={customRtspUrl}
                      onChange={(e) => setCustomRtspUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Link do DVR Web / Intelbras Cloud</label>
                    <input
                      type="url"
                      placeholder="http://meudominio.ddns-intelbras.com.br:8080"
                      value={customExternalUrl}
                      onChange={(e) => setCustomExternalUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              {editingCamera && (
                <button
                  type="button"
                  onClick={() => {
                    setCameraToDelete(editingCamera);
                    setShowAddModal(false);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Câmera</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  {editingCamera ? 'Salvar Alterações' : 'Conectar e Salvar Canal'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {capturedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Evidência Fotográfica Capturada</h3>
              </div>
              <button
                onClick={() => setCapturedSnapshot(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                <img src={capturedSnapshot.url} alt="Evidência" className="w-full h-full object-cover" />
              </div>
              <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <p><strong>Câmera:</strong> {capturedSnapshot.cam.name}</p>
                <p><strong>Local:</strong> {capturedSnapshot.cam.location}</p>
                <p><strong>Carimbo de Data/Hora:</strong> {currentTime}</p>
                <p className="text-[11px] text-slate-500 font-mono">Hash Evidência: #{Date.now()}-CFTV</p>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400">✓ Gravado no registro de auditoria</span>
              <button
                onClick={() => {
                  if (onAttachSnapshotToOccurrence) {
                    onAttachSnapshotToOccurrence(capturedSnapshot.url, capturedSnapshot.cam.name);
                  }
                  setCapturedSnapshot(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-colors cursor-pointer"
              >
                Vincular ao Livro de Ocorrências
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {cameraToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Ponto de Câmera?</h3>
                <p className="text-xs text-rose-300">Confirmação de exclusão</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja remover a câmera <strong className="text-white">"{cameraToDelete.name}"</strong> (Canal {cameraToDelete.dvrChannel || 1}) da central de monitoramento?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCameraToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCamera}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                Excluir Câmera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
