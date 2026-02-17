/**
 * Forecaster - AI天気予報士メッセージ表示
 * タイピングアニメーション付き
 */

export class Forecaster {
    constructor(messageElementId) {
        this.messageEl = document.getElementById(messageElementId);
        this.currentTimeout = null;
        this.fullText = '';
        this.charIndex = 0;
    }

    /**
     * メッセージをタイピングアニメーションで表示
     */
    showMessage(text, speed = 40) {
        this.clear();
        this.fullText = text;
        this.charIndex = 0;
        this.messageEl.innerHTML = '<span class="cursor-blink"></span>';

        this.typeNext(speed);
    }

    typeNext(speed) {
        if (this.charIndex >= this.fullText.length) {
            // Done typing - remove cursor
            this.messageEl.innerHTML = this.fullText;
            return;
        }

        this.charIndex++;
        const displayText = this.fullText.substring(0, this.charIndex);
        this.messageEl.innerHTML = displayText + '<span class="cursor-blink"></span>';

        this.currentTimeout = setTimeout(() => this.typeNext(speed), speed);
    }

    clear() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        this.messageEl.textContent = '';
    }
}
