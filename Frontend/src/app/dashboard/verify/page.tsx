'use client';

import { useMemo, useState, useEffect, useRef, type ChangeEvent, type PointerEvent } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from '@/lib/navigation';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const adultSteps = ['Intro', 'Personal Info', 'ID Documents', 'Face Check', 'Signature', 'Confirm', 'Verified'];
const minorSteps = ['Intro', 'Parent / Guardian', 'ID Documents', 'Face Check', 'Signature', 'Consent', 'Verified'];

type VerificationMode = 'adult' | 'minor';

type VerificationData = {
  fullName: string;
  email: string;
  dob: string;
  country: string;
  county: string;
  address: string;
  clubName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  idType: string;
  idFrontName: string;
  idBackName: string;
  selfieLink: string;
  signatureData: string;
  consent: boolean;
};

const COUNTRY_OPTIONS = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Nigeria', 'South Africa', 'Other'];
const KENYA_COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Kajiado', 'Kakamega', 'Eldoret', 'Meru'];
const ID_OPTIONS = ['National ID', 'Passport', 'Driver\'s License', 'Alien ID', 'Birth Certificate', 'Other'];
const poses = ['Center your face', 'Look right', 'Look left', 'Open mouth', 'Nod slowly'];

const defaultData: VerificationData = {
  fullName: '',
  email: '',
  dob: '',
  country: 'Kenya',
  county: '',
  address: '',
  clubName: '',
  phone: '',
  guardianName: '',
  guardianPhone: '',
  idType: 'National ID',
  idFrontName: '',
  idBackName: '',
  selfieLink: '',
  signatureData: '',
  consent: false,
};

export default function VerifyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [mode, setMode] = useState<VerificationMode>('adult');
  const [step, setStep] = useState(0);
  const [data, setData] = useState<VerificationData>(defaultData);
  const [poseIndex, setPoseIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const steps = mode === 'adult' ? adultSteps : minorSteps;

  useEffect(() => {
    if (user?.email) {
      setData((prev) => ({ ...prev, email: user.email ?? prev.email }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (step !== 3 || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        toast({
          variant: 'destructive',
          title: 'Camera unavailable',
          description: 'Please allow camera access to continue the face check.',
        });
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [step, toast]);

  useEffect(() => {
    if (!signatureCanvasRef.current) return;

    const canvas = signatureCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    context.scale(ratio, ratio);
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#f8fbff';
    context.fillStyle = '#0d1b2a';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [step]);

  const currentTitle = useMemo(() => {
    const current = steps[step];
    if (current === 'Personal Info') return 'Personal information';
    if (current === 'Parent / Guardian') return 'Parent / guardian';
    if (current === 'ID Documents') return 'ID documents';
    if (current === 'Face Check') return 'Face check';
    if (current === 'Signature') return 'Signature';
    if (current === 'Confirm') return 'Confirm';
    if (current === 'Consent') return 'Consent';
    if (current === 'Verified') return 'Verified';
    return 'Intro';
  }, [step, steps]);

  const currentSubtitle = useMemo(() => {
    if (step === 0) return 'Confirm your identity and choose the verification type.';
    if (step === 1) return mode === 'adult' ? 'Add your personal details and residential address.' : 'Add the parent or guardian details for the minor athlete.';
    if (step === 2) return 'Upload the front and back of your verification document.';
    if (step === 3) return 'Follow the live prompts to verify your face and identity.';
    if (step === 4) return 'Sign in the box to confirm your declaration.';
    if (step === 5) return 'Review everything before submitting your verification request.';
    return 'Your verification request is ready for approval.';
  }, [mode, step]);

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) {
      if (mode === 'adult') {
        return !!data.fullName.trim() && !!data.dob && !!data.phone.trim() && !!data.country && !!data.address.trim() && (data.country !== 'Kenya' || !!data.county);
      }
      return !!data.fullName.trim() && !!data.guardianName.trim() && !!data.guardianPhone.trim() && !!data.country && !!data.address.trim() && (data.country !== 'Kenya' || !!data.county);
    }
    if (step === 2) return !!data.idType && !!data.idFrontName && !!data.idBackName;
    if (step === 3) return !!data.selfieLink;
    if (step === 4) return !!data.signatureData;
    if (step === 5) return data.consent;
    return true;
  };

  const showNextPose = () => {
    setPoseIndex((current) => (current + 1) % poses.length);
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 420;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setData((prev) => ({ ...prev, selfieLink: dataUrl }));
    toast({ title: 'Selfie captured', description: 'Your identity check is ready for review.' });
  };

  const startSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const drawSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !isDrawingRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const finishSignature = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    setData((prev) => ({ ...prev, signatureData: canvas.toDataURL('image/png') }));
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#0d1b2a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setData((prev) => ({ ...prev, signatureData: '' }));
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setData((prev) => ({ ...prev, signatureData: dataUrl }));
    toast({ title: 'Signature saved', description: 'Your declaration has been recorded.' });
  };

  const next = async () => {
    if (!canContinue()) {
      toast({ variant: 'destructive', title: 'Missing details', description: 'Please complete the required fields before continuing.' });
      return;
    }

    if (step === 4) {
      finishSignature();
    }

    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    if (!firestore || !user?.uid) {
      toast({ variant: 'destructive', title: 'Verification unavailable', description: 'Please sign in again and try submitting your verification request.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = `verify_athlete_${user.uid}`;
      const requestedAt = new Date().toISOString();
      await setDoc(doc(firestore, 'verification_requests', requestId), {
        id: requestId,
        targetUid: user.uid,
        targetType: 'athlete',
        status: 'pending',
        requestedAt,
        linkedInUrl: user.email || 'N/A',
        nationalIdUrl: data.idFrontName || 'N/A',
        registrationDocUrl: data.idBackName || 'N/A',
        submittedData: { ...data, mode },
        clubId: data.clubName || null,
      }, { merge: true });

      await setDoc(doc(firestore, 'athletes', user.uid), {
        verificationStatus: 'pending',
        verificationSubmittedAt: requestedAt,
        updatedAt: requestedAt,
      }, { merge: true });

      toast({ title: 'Verification submitted', description: 'Your request has been sent for review.' });
      router.push('/dashboard/settings');
    } catch (error) {
      console.error('[Verification submit failed]', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: 'Your verification request could not be saved. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.push('/dashboard/settings');
  };

  const progressLength = steps.length;
  const filledBarCount = step + 1;

  return (
    <div className="min-h-screen bg-[#07131f] text-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[420px] rounded-[34px] border border-[#1d3557] bg-[#0d1b2a] shadow-[0_35px_90px_-30px_rgba(9,18,30,0.95)] overflow-hidden">
        <div className="px-4 pt-4 pb-0">
          <div className="flex gap-2">
            {Array.from({ length: progressLength }).map((_, idx) => (
              <span
                key={idx}
                className={`h-2 flex-1 rounded-full ${idx < filledBarCount ? 'bg-[#4f8ef7]' : 'bg-[#1d3557]'}`}
              />
            ))}
          </div>
        </div>

        <div className="px-4 pt-4 pb-5">
          <button
            type="button"
            onClick={back}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2f433c] bg-[#12231d] text-lg text-white hover:bg-[#183129]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="mt-5">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#88c6ff]">Step {step + 1} of {steps.length}</p>
            <h1 className="mt-2 text-[28px] font-black leading-[1.1] tracking-[-0.04em] text-[#f2f5f4]">{currentTitle}</h1>
            <p className="mt-2 text-[13px] leading-6 text-[#a8bbd4]">{currentSubtitle}</p>
          </div>

          <div className="mt-5 space-y-3">
            {step === 0 && (
              <>
                <div className="flex w-full overflow-hidden rounded-xl border border-[#2d413d] bg-[#12231d] p-1">
                  {(['adult', 'minor'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      className={`flex-1 rounded-lg px-3 py-2.5 text-[12px] font-black transition-colors ${
                        mode === option ? 'bg-[#1b2e29] text-white' : 'text-[#9aa79f]'
                      }`}
                    >
                      {option === 'adult' ? 'Adult / Club staff' : 'Minor player'}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-[#2d413d] bg-[#11211d] p-3 text-[12px] text-[#dfe9e4]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d382e] text-base">👤</div>
                    <div>
                      <div className="font-bold text-white">{mode === 'adult' ? 'Adult / Club staff' : 'Minor player'}</div>
                      <div className="text-[#9aa79f]">Profile authenticity review</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Full name</label>
                  <input
                    value={data.fullName}
                    onChange={(e) => setData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white placeholder:text-[#7d93b3] outline-none"
                    placeholder="Haruni Nzai Randu"
                  />
                </div>

                {mode === 'adult' ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Date of birth</label>
                      <input
                        type="date"
                        value={data.dob}
                        onChange={(e) => setData((prev) => ({ ...prev, dob: e.target.value }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Country</label>
                      <select
                        value={data.country}
                        onChange={(e) => setData((prev) => ({ ...prev, country: e.target.value, county: e.target.value === 'Kenya' ? prev.county : '' }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country} value={country} className="bg-[#0d1b2a]">{country}</option>
                        ))}
                      </select>
                    </div>

                    {data.country === 'Kenya' && (
                      <div>
                        <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">County</label>
                        <select
                          value={data.county}
                          onChange={(e) => setData((prev) => ({ ...prev, county: e.target.value }))}
                          className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                        >
                          <option value="" className="bg-[#0d1b2a]">Select county</option>
                          {KENYA_COUNTIES.map((county) => (
                            <option key={county} value={county} className="bg-[#0d1b2a]">{county}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Address</label>
                      <input
                        value={data.address}
                        onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                        placeholder="Street, estate, apartment"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Phone number</label>
                      <input
                        value={data.phone}
                        onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                        placeholder="+254 7..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Guardian name</label>
                      <input
                        value={data.guardianName}
                        onChange={(e) => setData((prev) => ({ ...prev, guardianName: e.target.value }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                        placeholder="Parent / guardian name"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Guardian phone</label>
                      <input
                        value={data.guardianPhone}
                        onChange={(e) => setData((prev) => ({ ...prev, guardianPhone: e.target.value }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                        placeholder="+254 7..."
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Country</label>
                      <select
                        value={data.country}
                        onChange={(e) => setData((prev) => ({ ...prev, country: e.target.value, county: e.target.value === 'Kenya' ? prev.county : '' }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country} value={country} className="bg-[#0d1b2a]">{country}</option>
                        ))}
                      </select>
                    </div>

                    {data.country === 'Kenya' && (
                      <div>
                        <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">County</label>
                        <select
                          value={data.county}
                          onChange={(e) => setData((prev) => ({ ...prev, county: e.target.value }))}
                          className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                        >
                          <option value="" className="bg-[#0d1b2a]">Select county</option>
                          {KENYA_COUNTIES.map((county) => (
                            <option key={county} value={county} className="bg-[#0d1b2a]">{county}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Address</label>
                      <input
                        value={data.address}
                        onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))}
                        className="w-full rounded-xl border border-[#254569] bg-[#12263d] px-3 py-3 text-[14px] text-white outline-none"
                        placeholder="Street, estate, apartment"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Select ID type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ID_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setData((prev) => ({ ...prev, idType: option }))}
                        className={`rounded-xl border px-2 py-2.5 text-left text-[12px] font-bold transition ${
                          data.idType === option ? 'border-[#4f8ef7] bg-[#1d3d66] text-white' : 'border-[#254569] bg-[#12263d] text-[#d9e4f2]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-[#4f8ef7] bg-[#12263d] p-3">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Front part</div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#4f8ef7] bg-[#1d3d66] px-3 py-3 text-[12px] font-bold text-white">
                    <span className="text-xl leading-none">＋</span>
                    <span>{data.idFrontName ? 'Replace front image' : 'Add front image'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setData((prev) => ({ ...prev, idFrontName: file.name }));
                        }
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {data.idFrontName && <div className="mt-2 text-[11px] text-[#b9d2f7]">Selected: {data.idFrontName}</div>}
                </div>

                <div className="rounded-xl border border-dashed border-[#4f8ef7] bg-[#12263d] p-3">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Back part</div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#4f8ef7] bg-[#1d3d66] px-3 py-3 text-[12px] font-bold text-white">
                    <span className="text-xl leading-none">＋</span>
                    <span>{data.idBackName ? 'Replace back image' : 'Add back image'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setData((prev) => ({ ...prev, idBackName: file.name }));
                        }
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {data.idBackName && <div className="mt-2 text-[11px] text-[#b9d2f7]">Selected: {data.idBackName}</div>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#254569] bg-[#12263d] p-3 text-[12px] text-[#dfe9e4]">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Live face check</div>
                  <div className="overflow-hidden rounded-xl border border-[#4f8ef7] bg-black">
                    <video ref={videoRef} autoPlay muted playsInline className="h-52 w-full object-cover" />
                  </div>
                  <div className="mt-3 rounded-lg border border-[#254569] bg-[#0d1b2a] px-3 py-2 text-[11px] text-[#dfe9e4]">
                    {poses[poseIndex]}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 border-[#254569] bg-transparent text-white hover:bg-[#1d3d66]" onClick={showNextPose}>
                      Next prompt
                    </Button>
                    <Button type="button" className="flex-1 bg-[#4f8ef7] text-white font-black hover:bg-[#3f7fe4]" onClick={captureSelfie}>
                      Capture
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#254569] bg-[#12263d] p-3 text-[12px] text-[#dfe9e4]">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#a8bbd4]">Signature</div>
                  <canvas
                    ref={signatureCanvasRef}
                    className="h-28 w-full rounded-xl border border-[#4f8ef7] bg-[#0d1b2a]"
                    onPointerDown={startSignature}
                    onPointerMove={drawSignature}
                    onPointerUp={finishSignature}
                    onPointerLeave={finishSignature}
                  />
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 border-[#254569] bg-transparent text-white hover:bg-[#1d3d66]" onClick={clearSignature}>
                      Clear
                    </Button>
                    <Button type="button" className="flex-1 bg-[#4f8ef7] text-white font-black hover:bg-[#3f7fe4]" onClick={saveSignature}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="rounded-xl border border-[#254569] bg-[#12263d] p-3 text-[12px] text-[#dfe9e4]">
                <div className="font-bold text-white">Review details</div>
                <div className="mt-3 space-y-2 text-[#a8bbd4]">
                  <div>Name: {data.fullName || '—'}</div>
                  <div>Email: {data.email || '—'}</div>
                  {mode === 'adult' ? <div>Phone: {data.phone || '—'}</div> : <div>Guardian: {data.guardianName || '—'}</div>}
                  <div>Country: {data.country || '—'}</div>
                  {data.country === 'Kenya' && <div>County: {data.county || '—'}</div>}
                  <div>Address: {data.address || '—'}</div>
                  <div>ID type: {data.idType || '—'}</div>
                  <div>Files: {data.idFrontName || '—'} / {data.idBackName || '—'}</div>
                </div>

                <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#254569] bg-[#12263d] p-3 text-[12px] text-[#e8f1ee]">
                  <input
                    type="checkbox"
                    checked={data.consent}
                    onChange={(e) => setData((prev) => ({ ...prev, consent: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-[#4f8ef7]"
                  />
                  <span>
                    {mode === 'adult'
                      ? 'I confirm the information is accurate and I am ready to submit this verification request.'
                      : 'I confirm the guardian has approved this submission and the information is accurate.'}
                  </span>
                </label>
              </div>
            )}

            {step === steps.length - 1 && (
              <div className="rounded-xl border border-[#254569] bg-[#12263d] p-3 text-[12px] text-[#dfe9e4]">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck className="h-4 w-4 text-[#88c6ff]" />
                  Verification complete
                </div>
                <div className="mt-2 text-[#a8bbd4]">Your request is ready to be sent for review.</div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1 border-[#254569] bg-transparent text-white hover:bg-[#12263d]" onClick={back}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#4f8ef7] text-white font-black hover:bg-[#3f7fe4] disabled:cursor-not-allowed disabled:opacity-70"
              onClick={next}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : step === steps.length - 1 ? 'Submit' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
