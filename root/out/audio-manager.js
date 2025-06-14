export class AudioManager {
    constructor() {
        this.isPlayed = new Set();
        this.song = new Audio();
        this.selectSound = new Audio();
        this.jumpSound = new Audio();
        this.hitSound = new Audio();
        this.getSource();
        this.preloadAudio();
    }
    getSource() {
        //Path
        const songPath = '../../assets/audio/rainbow-song.ogg';
        const selectSoundPath = '../../assets/audio/select-sound.ogg';
        const jumpSoundPath = '../../assets/audio/jump-sound.ogg';
        const hitSoundPath = '../../assets/audio/hit-sound.ogg';
        //Source
        this.song.src = songPath;
        this.song.volume = 0.035;
        this.selectSound.src = selectSoundPath;
        this.jumpSound.src = jumpSoundPath;
        this.hitSound.src = hitSoundPath;
    }
    getSound(type) {
        switch (type) {
            case 'song':
                return this.song;
            case 'select':
                return this.selectSound;
            case 'jump':
                return this.jumpSound;
            case 'hit':
                return this.hitSound;
            default:
                console.warn(`Unknown sound type: ${type}`);
                return null;
        }
    }
    preloadAudio() {
        this.selectSound.load();
        this.jumpSound.load();
        this.hitSound.load();
    }
    playAudio(type) {
        const sound = this.getSound(type);
        if (!sound || this.isPlayed.has(type))
            return;
        try {
            sound.currentTime = 0;
            sound.play().then(() => {
                this.isPlayed.add(type);
                sound.onended = () => this.isPlayed.delete(type);
            }).catch(e => console.warn(`${type} sound failed:`, e));
        }
        catch (e) {
            console.warn(`Error playing ${type} sound:`, e);
        }
    }
    pauseAudio(type) {
        const sound = this.getSound(type);
        if (sound)
            sound.pause();
    }
    stopAudio(type) {
        const sound = this.getSound(type);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }
}
