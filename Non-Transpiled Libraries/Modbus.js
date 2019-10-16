class Modbus {

    constructor(device) {
        this.usb = device;
        this.COMMAND_LIST = [];
        setInterval(this.checkCommandQ.bind(this), 1);
        this.lastCommandTime = 0;
    }

    modbusSendCommand(command) {
        var Uint8Command = new Uint8Array(command.length / 2);
        for (let i = 0; i < command.length / 2; i++) {
            let byte = '0x' + command.substring(i * 2, (i * 2) + 2);
            Uint8Command[i] = byte;
        }
        Uint8Command = this.addCRC(Uint8Command);
        this.COMMAND_LIST.push({
            command: Uint8Command
        });
    }

    checkCommandQ() {
        if (this.COMMAND_LIST[0] != null) {
            let time = new Date().getTime();
            if (time - this.lastCommandTime > 100) {
                this.write(this.COMMAND_LIST[0].command);
                this.COMMAND_LIST.shift();
                this.lastCommandTime = time;
                if (this.COMMAND_LIST[0] == null) {
                    this.lastCommandTime = 0;
                }
            }
        }
    }

    addCRC(buffer) {
        // Copyright (c) 2015-2017, Yaacov Zamir <kobi.zamir@gmail.com>
        // Permission to use, copy, modify, and/or distribute this software for any
        // purpose with or without fee is hereby granted, provided that the above
        // copyright notice and this permission notice appear in all copies.
        var crc = 0xFFFF;
        var odd;
        for (let i = 0; i < buffer.length; i++) {
            crc = crc ^ buffer[i];
            for (let j = 0; j < 8; j++) {
                odd = crc & 0x0001;
                crc = crc >> 1;
                if (odd) {
                    crc = crc ^ 0xA001;
                }
            }
        }
        let commandWithCRC = new Uint8Array(8);
        commandWithCRC.set(buffer);
        commandWithCRC[6] = crc & 0x00FF;
        commandWithCRC[7] = (crc & 0xFF00) >> 8;
        return commandWithCRC;
    };

    async write(data) {
        await this.usb.transferOut(2, data);
    }
}

module.exports = { Modbus };
