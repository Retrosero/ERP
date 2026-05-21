/**
 * Barkod Tarayıcı Component
 * Kamera üzerinden barkod/QR kod tarama işlemi
 * html5-qrcode kütüphanesi kullanılarak CameraX benzeri deneyim sunar
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  X,
  Flashlight,
  SwitchCamera,
  Maximize2,
  Minimize2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
  formats?: Html5QrcodeSupportedFormats[];
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
  preferredCamera?: 'environment' | 'user';
  className?: string;
  showResult?: boolean;
}

interface ScanResult {
  code: string;
  format: string;
  timestamp: Date;
}

export function BarcodeScanner({
  onScan,
  onClose,
  formats = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
  ],
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.777778,
  disableFlip = false,
  preferredCamera = 'environment',
  className,
  showResult = true,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Initialize scanner
  const initScanner = useCallback(async () => {
    const scannerId = 'barcode-scanner';

    try {
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(
          devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` }))
        );

        // Find preferred camera
        let selectedCamera = devices[0];
        if (preferredCamera === 'environment') {
          const backCamera = devices.find(
            (d) => d.label.toLowerCase().includes('back') ||
                   d.label.toLowerCase().includes('rear') ||
                   d.label.toLowerCase().includes('environment')
          );
          if (backCamera) selectedCamera = backCamera;
        } else {
          const frontCamera = devices.find(
            (d) => d.label.toLowerCase().includes('front') ||
                   d.label.toLowerCase().includes('user')
          );
          if (frontCamera) selectedCamera = frontCamera;
        }

        setCameraId(selectedCamera.id);
      }

      scannerRef.current = new Html5Qrcode(scannerId);
      setHasPermission(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setError('Kamera erişimi reddedildi veya bulunamadı.');
    }
  }, [preferredCamera]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!scannerRef.current || !cameraId || isPaused) return;

    try {
      await scannerRef.current.start(
        cameraId,
        {
          fps,
          qrbox: typeof qrbox === 'number' ? { width: qrbox, height: qrbox } : qrbox,
          aspectRatio,
          disableFlip,
        },
        (decodedText, decodedResult) => {
          // Debounce: prevent same barcode scanned within 2 seconds
          const now = Date.now();
          if (now - lastScanTimeRef.current < 2000 && lastScan?.code === decodedText) {
            return;
          }
          lastScanTimeRef.current = now;

          const result: ScanResult = {
            code: decodedText,
            format: decodedResult.result.format?.formatName || 'Unknown',
            timestamp: new Date(),
          };

          setLastScan(result);
          setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
          onScan(decodedText);
        },
        () => {
          // QR code scan failure - ignore
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Start scanning error:', err);
      setError('Tarama başlatılamadı. Lütfen tekrar deneyin.');
    }
  }, [cameraId, fps, qrbox, aspectRatio, disableFlip, isPaused, lastScan, onScan]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Stop scanning error:', err);
      }
    }
  }, [isScanning]);

  // Toggle torch/flashlight
  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !isScanning) return;

    try {
      const track = scannerRef.current.getRunningTrackCameraCapabilities();
      if (track && typeof track === 'object') {
        // Torch functionality depends on browser support
        setIsTorchOn(!isTorchOn);
      }
    } catch (err) {
      console.error('Torch toggle error:', err);
    }
  }, [isScanning, isTorchOn]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) return;

    await stopScanning();

    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    setCameraId(availableCameras[nextIndex].id);

    // Restart with new camera
    setTimeout(() => startScanning(), 500);
  }, [availableCameras, currentCameraIndex, stopScanning, startScanning]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      stopScanning();
    } else {
      startScanning();
    }
  }, [isPaused, stopScanning, startScanning]);

  // Initialize on mount
  useEffect(() => {
    initScanner();

    return () => {
      stopScanning();
    };
  }, [initScanner]);

  // Start scanning when camera is ready
  useEffect(() => {
    if (cameraId && hasPermission && !isScanning && !isPaused) {
      startScanning();
    }
  }, [cameraId, hasPermission, isScanning, isPaused, startScanning]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Scanner Container */}
      <Card className="overflow-hidden bg-black" padding="none">
        {/* Video/Scanner Area */}
        <div className="relative aspect-video bg-slate-900">
          {/* Scanner div for html5-qrcode */}
          <div id="barcode-scanner" className="w-full h-full" />

          {/* Permission/Error States */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6">
              <CameraOff className="w-16 h-16 text-red-400 mb-4" />
              <p className="text-center font-medium">{error || 'Kamera erişimi reddedildi'}</p>
              <p className="text-sm text-slate-400 mt-2 text-center">
                Lütfen tarayıcı izinlerini kontrol edin ve sayfayı yenileyin.
              </p>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Sayfayı Yenile
              </Button>
            </div>
          )}

          {hasPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
              <Loader2 className="w-12 h-12 animate-spin text-teal-400 mb-4" />
              <p className="text-center">Kamera başlatılıyor...</p>
            </div>
          )}

          {/* Scanning Overlay */}
          {isScanning && !isPaused && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                {/* Top Left */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                {/* Top Right */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                {/* Bottom Left */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                {/* Bottom Right */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

                {/* Scanning line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse top-0"
                     style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {isPaused && isScanning && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
              <Pause className="w-16 h-16 text-teal-400 mb-4" />
              <p className="text-white font-medium">Tarama Duraklatıldı</p>
            </div>
          )}

          {/* Last Scan Result */}
          {showResult && lastScan && !isPaused && (
            <div className="absolute bottom-4 left-4 right-4 bg-teal-500/90 backdrop-blur-sm rounded-xl p-3 text-white animate-slide-up">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-lg truncate">{lastScan.code}</p>
                  <p className="text-xs opacity-80">{lastScan.format}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-2">
            {/* Camera Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTorch}
                disabled={!isScanning}
                className={cn(
                  'p-3 rounded-xl transition-colors',
                  isTorchOn
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
                  !isScanning && 'opacity-50 cursor-not-allowed'
                )}
                title="Fener"
              >
                <Flashlight className="w-5 h-5" />
              </button>

              {availableCameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  disabled={!isScanning}
                  className={cn(
                    'p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors',
                    !isScanning && 'opacity-50 cursor-not-allowed'
                  )}
                  title="Kamerayı Değiştir"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={togglePause}
                disabled={!isScanning}
                className={cn(
                  'p-3 rounded-xl transition-colors',
                  isPaused
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
                  !isScanning && 'opacity-50 cursor-not-allowed'
                )}
                title={isPaused ? 'Devam Et' : 'Duraklat'}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            </div>

            {/* Fullscreen & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                title={isFullscreen ? 'Küçült' : 'Büyüt'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              {onClose && (
                <button
                  onClick={() => {
                    stopScanning();
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Camera Label */}
          {availableCameras[currentCameraIndex] && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              {availableCameras[currentCameraIndex].label}
            </p>
          )}
        </div>
      </Card>

      {/* Scan History */}
      {showResult && scanHistory.length > 0 && (
        <Card className="mt-4">
          <h3 className="font-semibold text-slate-900 mb-3">Tarama Geçmişi</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scanHistory.map((scan, index) => (
              <div
                key={`${scan.code}-${index}`}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
              >
                <span className="font-mono text-sm">{scan.code}</span>
                <span className="text-xs text-slate-500">
                  {scan.format} • {scan.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
}

// Barcode input with manual entry option
interface BarcodeInputProps {
  onSubmit: (barcode: string) => void;
  onScan?: () => void;
  placeholder?: string;
  className?: string;
}

export function BarcodeInput({
  onSubmit,
  onScan,
  placeholder = 'Barkod numarasını girin...',
  className,
}: BarcodeInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
      />
      {onScan && (
        <Button type="button" variant="secondary" onClick={onScan}>
          <Camera className="w-4 h-4 mr-2" />
          Tara
        </Button>
      )}
      <Button type="submit" disabled={!value.trim()}>
        Ara
      </Button>
    </form>
  );
}

export default BarcodeScanner;