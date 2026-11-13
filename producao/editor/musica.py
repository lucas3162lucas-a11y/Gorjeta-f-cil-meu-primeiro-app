# Trilha de fundo simples gerada por código (pad + baixo + batida leve), 100 bpm
import numpy as np, sys, wave
dur=float(sys.argv[1]); out=sys.argv[2]; sr=44100
t=np.arange(int(dur*sr))/sr
bpm=100; beat=60/bpm; bar=beat*4
def f(n): return 440*2**((n-69)/12)
chords=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]]  # Cmaj7 Am7 Fmaj7 G7
bass=[36,33,29,31]
y=np.zeros_like(t)
for i in range(int(dur/bar)+1):
    s=int(i*bar*sr); e=min(len(t),int((i+1)*bar*sr))
    if s>=len(t): break
    tt=t[s:e]-i*bar
    env=np.minimum(1,tt/0.4)*np.exp(-tt*0.25)
    c=chords[i%4]
    for n in c:
        y[s:e]+=0.08*env*(np.sin(2*np.pi*f(n)*tt)+0.3*np.sin(2*np.pi*2*f(n)*tt+0.5))
    for k in range(4):
        bs=int((i*bar+k*beat)*sr); be=min(len(t),bs+int(beat*sr))
        if bs>=len(t): break
        bt=t[bs:be]-(i*bar+k*beat)
        y[bs:be]+=0.18*np.exp(-bt*5)*np.sin(2*np.pi*f(bass[i%4])*bt)
        # kick suave
        y[bs:be]+=0.25*np.exp(-bt*25)*np.sin(2*np.pi*(55+90*np.exp(-bt*30))*bt)
        # chimbal no contratempo
        hs=int((i*bar+k*beat+beat/2)*sr); he=min(len(t),hs+int(0.05*sr))
        if hs<len(t):
            ht=np.arange(he-hs)/sr
            y[hs:he]+=0.04*np.exp(-ht*80)*np.random.randn(he-hs)
fade=np.minimum(1,np.minimum(t/1.0,(dur-t)/1.5))
y*=fade; y/=np.max(np.abs(y))*1.05
d=(y*32767).astype(np.int16)
with wave.open(out,'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(d.tobytes())
print("ok")
