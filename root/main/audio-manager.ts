export class AudioManager {
    private song: HTMLAudioElement;
    private selectSound: HTMLAudioElement;
    private jumpSound: HTMLAudioElement;
    private hitSound: HTMLAudioElement;

    constructor(
        song: HTMLAudioElement,
        selelectSound: HTMLAudioElement,
        jumpSound: HTMLAudioElement,
        hitSound: HTMLAudioElement
    ) {
        this.song = song;
        this.selectSound = selelectSound;
        this.jumpSound = jumpSound;
        this.hitSound = hitSound;
    }
} 