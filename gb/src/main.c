#include <gb/gb.h>
#include <gb/cgb.h>
#include <gb/sgb.h>
#include <gbdk/console.h>
#include <gbdk/font.h>
#include <stdio.h>
#include <string.h>

#include "../generated/posts_data.h"

#define SCREEN_COLS 20
#define SCREEN_ROWS 18
#define CONTENT_X 1
#define CONTENT_COLS 18
#define LIST_ROWS 16
#define READ_ROWS 16
#define HEADER_SCROLL_START_DELAY 8
#define HEADER_SCROLL_STEP_DELAY 2
#define HEADER_SCROLL_END_DELAY 8

#define VIEW_LIST 0
#define VIEW_READ 1

static uint8_t current_view = VIEW_LIST;
static uint8_t selected_post = 0;
static uint8_t list_scroll = 0;
static uint16_t read_line_offset = 0;
static uint16_t read_total_line_count = 0;
static uint16_t read_max_offset = 0;
static uint16_t read_pos_offset = 0;
static font_t font_normal = 0;
static font_t font_inverse = 0;
static uint8_t read_title_scroll = 0;
static uint8_t read_title_wait = HEADER_SCROLL_START_DELAY;
static uint8_t music_step_index = 0;
static uint8_t music_ticks_left = 0;
static uint8_t crab_x = 24;
static uint8_t crab_y = 56;
static int8_t crab_dx = 1;
static int8_t crab_dy = 1;
static uint8_t crab_anim_tick = 0;
static uint8_t crab_frame = 0;
static uint8_t crab_pause_timer = 0;
static uint8_t crab_wave_timer = 0;
static uint8_t crab_drift_tick = 0;
static uint8_t crab_turn_cooldown = 0;
static uint8_t crab_run_ticks = 32;
static uint8_t crab_visible = 0;
static uint8_t crab_leaving = 0;
static uint8_t crab_spawn_timer = 60;
static uint8_t crab_hello_visible = 0;
static uint8_t crab_hello_col = 0;
static uint8_t crab_hello_row = 0;
static uint8_t crab_hello_box_w = 0;
static uint8_t crab_hello_box_h = 0;
static uint8_t crab_speech_kind = 0;
static uint8_t crab_should_speak = 0;
static uint8_t crab_spoke_this_walkout = 0;
static uint8_t crab_speech_toggle = 0;
static uint8_t crab_speech_audio_active = 0;
static uint8_t crab_speech_audio_step = 0;
static uint8_t crab_speech_audio_ticks = 0;
static uint8_t crab_speech_backup[80];
static uint8_t crab_speech_backup_width = 0;
static uint8_t crab_speech_backup_lines = 0;
static uint8_t crab_speech_backup_valid = 0;
static uint8_t has_sgb = 0;
#define MUSIC_STEPS 32
#define NOTE_REST 0x0000
#define NOTE_C3 0x416
#define NOTE_D3 0x483
#define NOTE_E3 0x4E5
#define NOTE_F3 0x511
#define NOTE_G3 0x563
#define NOTE_A3 0x5AC
#define NOTE_B3 0x5ED
#define NOTE_C4 0x60B
#define NOTE_D4 0x642
#define NOTE_E4 0x672
#define NOTE_F4 0x689
#define NOTE_G4 0x6B2
#define NOTE_A4 0x6D6
#define NOTE_B4 0x6F7
#define NOTE_C5 0x706
#define NOTE_D5 0x721
#define NOTE_E5 0x739
#define NOTE_F5 0x744
#define NOTE_G5 0x759
#define NOTE_A5 0x76B
#define DRUM_NONE 0
#define DRUM_KICK 1
#define DRUM_SNARE 2
#define DRUM_HAT 3
#define CRAB_SPEECH_HELLO 0
#define CRAB_SPEECH_THANKS 1

static const char crab_msg_hello[] = "HELLO";
static const char crab_msg_thanks_1[] = "THANK YOU FOR";
static const char crab_msg_thanks_2[] = "READING MY BLOG!";

static const palette_color_t cgb_red_yellow_bkg[4] = {
	RGB_YELLOW, RGB_YELLOW, RGB_RED, RGB_RED
};

static const palette_color_t cgb_crab_body_obj[4] = {
	RGB_YELLOW, RGB_RED, RGB_RED, RGB_RED
};

static const palette_color_t cgb_crab_outline_obj[4] = {
	RGB_YELLOW, RGB_YELLOW, RGB_YELLOW, RGB_YELLOW
};

static const uint8_t crab_tiles[] = {
	/* tile 0: white outer outline (cartoon crab silhouette) */
	0x42, 0x00,
	0xE7, 0x00,
	0x7E, 0x00,
	0xFF, 0x00,
	0xFF, 0x00,
	0x7E, 0x00,
	0xA5, 0x00,
	0x42, 0x00,
	/* tile 1: crab walk A (black body/details) */
	0x00, 0x00,
	0x24, 0x00,
	0x3C, 0x00,
	0x7E, 0x00,
	0x7E, 0x00,
	0x3C, 0x00,
	0x5A, 0x00,
	0x24, 0x00,
	/* tile 2: crab walk B (alternate legs) */
	0x00, 0x00,
	0x24, 0x00,
	0x3C, 0x00,
	0x7E, 0x00,
	0x7E, 0x00,
	0x3C, 0x00,
	0x66, 0x00,
	0x42, 0x00,
	/* tile 3: crab wave (right claw up) */
	0x10, 0x00,
	0x3C, 0x00,
	0x3E, 0x00,
	0x7E, 0x00,
	0x7E, 0x00,
	0x3C, 0x00,
	0x66, 0x00,
	0x24, 0x00
};

static const uint16_t music_melody[MUSIC_STEPS] = {
	NOTE_A4, NOTE_REST, NOTE_G4, NOTE_REST, NOTE_E4, NOTE_D4, NOTE_C4, NOTE_REST,
	NOTE_E4, NOTE_REST, NOTE_D4, NOTE_REST, NOTE_C4, NOTE_REST, NOTE_A3, NOTE_REST,
	NOTE_C4, NOTE_REST, NOTE_E4, NOTE_G4, NOTE_REST, NOTE_E4, NOTE_D4, NOTE_C4,
	NOTE_REST, NOTE_A3, NOTE_C4, NOTE_D4, NOTE_REST, NOTE_C4, NOTE_A3, NOTE_REST
};

static const uint16_t music_harmony[MUSIC_STEPS] = {
	NOTE_E4, NOTE_REST, NOTE_C4, NOTE_REST, NOTE_E4, NOTE_REST, NOTE_C4, NOTE_REST,
	NOTE_D4, NOTE_REST, NOTE_A3, NOTE_REST, NOTE_D4, NOTE_REST, NOTE_A3, NOTE_REST,
	NOTE_E4, NOTE_REST, NOTE_C4, NOTE_REST, NOTE_E4, NOTE_REST, NOTE_C4, NOTE_REST,
	NOTE_D4, NOTE_REST, NOTE_A3, NOTE_REST, NOTE_C4, NOTE_REST, NOTE_A3, NOTE_REST
};

static const uint16_t music_pad[MUSIC_STEPS] = {
	NOTE_A3, NOTE_A3, NOTE_A3, NOTE_REST, NOTE_A3, NOTE_A3, NOTE_A3, NOTE_REST,
	NOTE_G3, NOTE_G3, NOTE_G3, NOTE_REST, NOTE_G3, NOTE_G3, NOTE_G3, NOTE_REST,
	NOTE_F3, NOTE_F3, NOTE_F3, NOTE_REST, NOTE_F3, NOTE_F3, NOTE_F3, NOTE_REST,
	NOTE_E3, NOTE_E3, NOTE_E3, NOTE_REST, NOTE_E3, NOTE_E3, NOTE_E3, NOTE_REST
};

static const uint8_t music_drums[MUSIC_STEPS] = {
	DRUM_KICK, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_SNARE, DRUM_NONE,
	DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_KICK, DRUM_NONE, DRUM_NONE, DRUM_NONE,
	DRUM_NONE, DRUM_NONE, DRUM_SNARE, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_NONE,
	DRUM_KICK, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_NONE, DRUM_SNARE, DRUM_NONE
};

static const uint8_t music_ticks[MUSIC_STEPS] = {
	4, 4, 4, 4, 4, 4, 4, 4,
	4, 4, 4, 4, 4, 4, 4, 6,
	4, 4, 4, 4, 4, 4, 4, 4,
	4, 4, 4, 4, 4, 4, 4, 6
};

static void music_play_square1(uint16_t freq) {
	if (freq == NOTE_REST) {
		NR12_REG = 0x00;
		return;
	}
	NR10_REG = 0x00;
	NR11_REG = 0x80;
	/* Slow-attack pad: start quiet, fade in slowly */
	NR12_REG = 0x1F;
	NR13_REG = (uint8_t)(freq & 0x00FFU);
	NR14_REG = 0x80U | (uint8_t)((freq >> 8) & 0x0007U);
}

static void music_play_square2(uint16_t freq) {
	if (freq == NOTE_REST) {
		NR22_REG = 0x00;
		return;
	}
	NR21_REG = 0x80;
	/* Slightly darker second pad voice with slow attack */
	NR22_REG = 0x1E;
	NR23_REG = (uint8_t)(freq & 0x00FFU);
	NR24_REG = 0x80U | (uint8_t)((freq >> 8) & 0x0007U);
}

static void music_load_wave(const uint8_t * wave_data) {
	volatile uint8_t * wave_ram = (volatile uint8_t *)0xFF30;
	uint8_t i;

	NR30_REG = 0x00;
	for (i = 0; i < 16; i++) {
		wave_ram[i] = wave_data[i];
	}
	NR30_REG = 0x80;
}

static void music_init_wave(void) {
	static const uint8_t wave_data_music[16] = {
		0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF,
		0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32, 0x10
	};
	music_load_wave(wave_data_music);
}

static void music_play_wave(uint16_t freq) {
	if (freq == NOTE_REST) {
		NR30_REG = 0x00;
		return;
	}
	NR30_REG = 0x80;
	NR31_REG = 0x20;
	NR32_REG = 0x60;
	NR33_REG = (uint8_t)(freq & 0x00FFU);
	NR34_REG = 0x80U | (uint8_t)((freq >> 8) & 0x0007U);
}

static void crab_speech_audio_start(void) {
	crab_speech_audio_active = 1;
	crab_speech_audio_step = 0;
	crab_speech_audio_ticks = 0;
}

static uint8_t crab_speech_audio_update(void) {
	static const uint8_t wave_data_speech[16] = {
		0x04, 0x8C, 0xEF, 0xC8, 0x40, 0x48, 0xCE, 0xFC,
		0x84, 0x04, 0x8C, 0xEF, 0xC8, 0x40, 0x48, 0xCE
	};

	if (!crab_speech_audio_active) return 0;

	if (crab_speech_audio_ticks > 0) {
		crab_speech_audio_ticks--;
		return 1;
	}

	if (crab_speech_audio_step == 0) {
		/* Pause backing channels so the crab voice is clear. */
		NR12_REG = 0x00;
		NR22_REG = 0x00;
		NR42_REG = 0x00;
		music_load_wave(wave_data_speech);
		NR30_REG = 0x80;
		NR31_REG = 0x20;
		NR32_REG = 0x20;
		NR33_REG = (uint8_t)(NOTE_E4 & 0x00FFU);
		NR34_REG = 0x80U | (uint8_t)((NOTE_E4 >> 8) & 0x0007U);
		crab_speech_audio_step = 1;
		crab_speech_audio_ticks = 6;
		return 1;
	}

	if (crab_speech_audio_step == 1) {
		NR30_REG = 0x80;
		NR31_REG = 0x20;
		NR32_REG = 0x20;
		NR33_REG = (uint8_t)(NOTE_C4 & 0x00FFU);
		NR34_REG = 0x80U | (uint8_t)((NOTE_C4 >> 8) & 0x0007U);
		crab_speech_audio_step = 2;
		crab_speech_audio_ticks = 6;
		return 1;
	}

	NR30_REG = 0x00;
	music_init_wave();
	crab_speech_audio_active = 0;
	music_ticks_left = 0;
	return 0;
}

static void music_play_drum(uint8_t drum) {
	if (drum == DRUM_NONE) return;
	NR41_REG = 0x08;
	if (drum == DRUM_KICK) {
		NR42_REG = 0x92;
		NR43_REG = 0x45;
	} else if (drum == DRUM_SNARE) {
		NR42_REG = 0x82;
		NR43_REG = 0x3C;
	} else {
		NR42_REG = 0x52;
		NR43_REG = 0x11;
	}
	NR44_REG = 0x80;
}

static void music_init(void) {
	NR52_REG = 0x80;
	NR50_REG = 0x44;
	NR51_REG = 0xFF;
	music_init_wave();
	music_step_index = 0;
	music_ticks_left = 0;
}

static void music_update(void) {
	if (crab_speech_audio_update()) {
		return;
	}

	if (music_ticks_left > 0) {
		music_ticks_left--;
		return;
	}

	music_play_wave(music_melody[music_step_index]);
	music_play_square2(music_harmony[music_step_index]);
	music_play_square1(music_pad[music_step_index]);
	music_play_drum(music_drums[music_step_index]);

	music_ticks_left = music_ticks[music_step_index];
	music_step_index++;
	if (music_step_index >= MUSIC_STEPS) {
		music_step_index = 0;
	}
}

static void crab_clear_hello(void) {
	if (!crab_hello_visible) return;
	if (crab_speech_backup_valid) {
		set_bkg_tiles(
			crab_hello_col,
			crab_hello_row,
			crab_speech_backup_width,
			crab_speech_backup_lines,
			crab_speech_backup
		);
	}
	crab_hello_visible = 0;
	crab_hello_box_w = 0;
	crab_hello_box_h = 0;
	crab_speech_backup_valid = 0;
}

static void crab_show_hello(void) {
	uint8_t col = (uint8_t)(crab_x >> 3);
	uint8_t row = (uint8_t)(crab_y >> 3);
	uint8_t box_w;
	uint8_t box_h;

	if (crab_speech_kind == CRAB_SPEECH_THANKS) {
		box_w = (uint8_t)((sizeof(crab_msg_thanks_1) > sizeof(crab_msg_thanks_2))
			? (sizeof(crab_msg_thanks_1) - 1U)
			: (sizeof(crab_msg_thanks_2) - 1U));
		box_h = 2;
	} else {
		box_w = (uint8_t)(sizeof(crab_msg_hello) - 1U);
		box_h = 1;
	}

	if (box_h == 1) {
		if (col > 2) col = (uint8_t)(col - 2);
	} else {
		if (col > 1) {
			col = (uint8_t)(col - 1);
		}
	}
	if (row > 3) {
		row = (uint8_t)(row - 3);
	} else {
		row = 1;
	}
	if (col > (uint8_t)(SCREEN_COLS - box_w)) col = (uint8_t)(SCREEN_COLS - box_w);
	if (row > (uint8_t)(16 - box_h)) row = (uint8_t)(16 - box_h);

	if (crab_hello_visible &&
		(crab_hello_col != col || crab_hello_row != row || crab_hello_box_w != box_w || crab_hello_box_h != box_h)) {
		crab_clear_hello();
	}

	crab_hello_col = col;
	crab_hello_row = row;
	crab_hello_box_w = box_w;
	crab_hello_box_h = box_h;
	/* Capture underlying tiles only once per bubble instance. */
	if (!crab_hello_visible) {
		crab_speech_backup_width = crab_hello_box_w;
		crab_speech_backup_lines = crab_hello_box_h;
		get_bkg_tiles(
			crab_hello_col,
			crab_hello_row,
			crab_speech_backup_width,
			crab_speech_backup_lines,
			crab_speech_backup
		);
		crab_speech_backup_valid = 1;
	}

	if (box_h == 1) {
		font_set(font_inverse);
		gotoxy(col, row);
		printf("%s", crab_msg_hello);
		font_set(font_normal);
	} else {
		font_set(font_inverse);
		gotoxy(col, row);
		printf("%s", crab_msg_thanks_1);
		gotoxy(col, (uint8_t)(row + 1));
		printf("%s", crab_msg_thanks_2);
		font_set(font_normal);
	}
	crab_hello_visible = 1;
}

static void crab_apply_facing(void) {
	uint8_t body_prop = DEVICE_SUPPORTS_COLOR ? OAMF_CGB_PAL0 : 0x00;
	uint8_t outline_prop = DEVICE_SUPPORTS_COLOR ? OAMF_CGB_PAL1 : S_PALETTE;

	if (crab_dx < 0) {
		set_sprite_prop(0, (uint8_t)(body_prop | S_FLIPX));
		set_sprite_prop(1, (uint8_t)(outline_prop | S_FLIPX));
	} else {
		set_sprite_prop(0, body_prop);
		set_sprite_prop(1, outline_prop);
	}
}

static void crab_init(void) {
	SPRITES_8x8;
	/* Body palette (OBP0): any colored pixel -> black */
	OBP0_REG = 0xFC;
	/* Outline palette (OBP1): any colored pixel -> white */
	OBP1_REG = 0x00;
	set_sprite_data(0, 4, crab_tiles);
	/* sprite 0: body (front), sprite 1: white outline (back) */
	set_sprite_tile(0, 1);
	set_sprite_tile(1, 0);
	crab_apply_facing();
	move_sprite(0, 0, 0);
	move_sprite(1, 0, 0);
	SHOW_SPRITES;
}

static void crab_update(void) {
	uint8_t noise;
	uint8_t spawn_noise;

	if (!crab_visible) {
		crab_clear_hello();
		if (crab_spawn_timer > 0) {
			crab_spawn_timer--;
			return;
		}

		spawn_noise = (uint8_t)(DIV_REG ^ music_step_index ^ crab_anim_tick);
		crab_visible = 1;
		crab_leaving = 0;
		crab_pause_timer = 0;
		crab_wave_timer = 0;
		crab_spoke_this_walkout = 0;
		/* Stay around longer so greetings are actually seen. */
		crab_run_ticks = (uint8_t)(96 + (spawn_noise & 0x3F));
		/* Debug-friendly: every walkout includes speech. */
		crab_should_speak = 1;
		crab_turn_cooldown = 8;
		crab_x = (spawn_noise & 0x01) ? 168 : 0;
		crab_dx = (crab_x == 0) ? 1 : -1;
		crab_dy = (spawn_noise & 0x20) ? 1 : -1;
		crab_y = (uint8_t)(48 + (spawn_noise & 0x1F));
		crab_apply_facing();
		move_sprite(0, crab_x, crab_y);
		move_sprite(1, crab_x, crab_y);
		return;
	}

	crab_pause_timer++;
	if (crab_wave_timer == 0 && crab_should_speak && !crab_spoke_this_walkout && crab_pause_timer >= 24) {
		crab_pause_timer = 0;
		crab_spoke_this_walkout = 1;
		crab_speech_toggle ^= 1;
		crab_speech_kind = crab_speech_toggle ? CRAB_SPEECH_THANKS : CRAB_SPEECH_HELLO;
		crab_wave_timer = (crab_speech_kind == CRAB_SPEECH_THANKS) ? 72 : 48;
		crab_speech_audio_start();
	}

	if (crab_wave_timer > 0) {
		crab_wave_timer--;
		crab_anim_tick++;
		if (crab_anim_tick >= 8) {
			crab_anim_tick = 0;
			crab_frame ^= 1;
			set_sprite_tile(0, crab_frame ? 3 : 1);
		}
		crab_show_hello();
		move_sprite(0, crab_x, crab_y);
		move_sprite(1, crab_x, crab_y);
		return;
	}

	crab_clear_hello();

	crab_anim_tick++;
	if (crab_anim_tick >= 6) {
		crab_anim_tick = 0;
		crab_frame ^= 1;
		set_sprite_tile(0, crab_frame ? 2 : 1);
	}

	/* Pseudo-random run segments so direction changes happen in both directions. */
	noise = (uint8_t)(DIV_REG ^ crab_x ^ (crab_y << 1) ^ crab_anim_tick);
	if (!crab_leaving) {
		if (crab_turn_cooldown > 0) crab_turn_cooldown--;
		if (crab_run_ticks > 0) {
			crab_run_ticks--;
		} else {
			/* Time to leave the reader and head off-screen. */
			crab_leaving = 1;
			if (noise & 0x01) {
				crab_dx = 1;
			} else {
				crab_dx = -1;
			}
			crab_apply_facing();
		}
		if (crab_turn_cooldown == 0 && (noise & 0x3F) == 0x12) {
			crab_dx = (int8_t)-crab_dx;
			crab_apply_facing();
			crab_turn_cooldown = 16;
		}
	}

	/* Crabs primarily side-walk: horizontal every frame. */
	crab_x = (uint8_t)((int16_t)crab_x + crab_dx);

	/* Small, infrequent vertical drift so it doesn't look rigid. */
	crab_drift_tick++;
	if (crab_drift_tick >= 10) {
		crab_drift_tick = 0;
		if ((noise & 0x3F) == 0x1A) {
			crab_dy = (int8_t)-crab_dy;
		}
		crab_y = (uint8_t)((int16_t)crab_y + crab_dy);
	}

	if (crab_y <= 48) {
		crab_y = 48;
		crab_dy = 1;
	} else if (crab_y >= 72) {
		crab_y = 72;
		crab_dy = -1;
	}

	/* No edge bounce: once it chooses to leave and walks off-screen, hide. */
	if (crab_leaving && (crab_x <= 2 || crab_x >= 166)) {
		crab_visible = 0;
		crab_leaving = 0;
		crab_spawn_timer = (uint8_t)(40 + (noise & 0x7F));
		crab_clear_hello();
		move_sprite(0, 0, 0);
		move_sprite(1, 0, 0);
		return;
	}

	move_sprite(0, crab_x, crab_y);
	move_sprite(1, crab_x, crab_y);
}

static void set_normal_colors(void) {
	font_color(DMG_BLACK, DMG_WHITE);
}

static void set_bar_colors(void) {
	font_color(DMG_WHITE, DMG_BLACK);
}

static void sgb_write_color(uint8_t * packet, uint8_t * idx, uint16_t color) {
	packet[*idx] = (uint8_t)(color & 0xFF);
	packet[(uint8_t)(*idx + 1)] = (uint8_t)(color >> 8);
	*idx = (uint8_t)(*idx + 2);
}

static void sgb_apply_red_yellow_palette_pair(uint8_t command) {
	uint8_t packet[16];
	uint8_t idx = 1;
	uint16_t yellow = RGB_YELLOW;
	uint16_t red = RGB_RED;

	memset(packet, 0, sizeof(packet));
	packet[0] = (uint8_t)((command << 3) | 1);

	/* Shared color 0 + three colors for each palette in the pair. */
	sgb_write_color(packet, &idx, yellow);
	sgb_write_color(packet, &idx, red);
	sgb_write_color(packet, &idx, red);
	sgb_write_color(packet, &idx, red);
	sgb_write_color(packet, &idx, red);
	sgb_write_color(packet, &idx, red);
	sgb_write_color(packet, &idx, red);

	sgb_transfer(packet);
}

static void apply_color_theme(void) {
	if (DEVICE_SUPPORTS_COLOR) {
		set_bkg_palette(BKGF_CGB_PAL0, 1, cgb_red_yellow_bkg);
		set_sprite_palette(OAMF_CGB_PAL0, 1, cgb_crab_body_obj);
		set_sprite_palette(OAMF_CGB_PAL1, 1, cgb_crab_outline_obj);
		return;
	}

	if (has_sgb) {
		sgb_apply_red_yellow_palette_pair(SGB_PAL_01);
		sgb_apply_red_yellow_palette_pair(SGB_PAL_23);
	}
}

static void write_padded_line(uint8_t row, const char * text) {
	char linebuf[SCREEN_COLS + 1];
	uint8_t i;

	for (i = 0; i < SCREEN_COLS; i++) linebuf[i] = ' ';
	linebuf[SCREEN_COLS] = '\0';

	for (i = 0; i < SCREEN_COLS && text[i] != '\0'; i++) {
		linebuf[i] = text[i];
	}

	gotoxy(0, row);
	printf("%s", linebuf);
}

static void draw_bar(uint8_t row, const char * text) {
	font_set(font_inverse);
	write_padded_line(row, text);
	font_set(font_normal);
}

static void draw_read_bar_offset(uint8_t row, const char * text, uint8_t start) {
	char linebuf[SCREEN_COLS + 1];
	uint8_t i;

	for (i = 0; i < SCREEN_COLS; i++) linebuf[i] = ' ';
	linebuf[SCREEN_COLS] = '\0';
	for (i = 0; i < CONTENT_COLS; i++) {
		uint8_t src = (uint8_t)(start + i);
		if (text[src] == '\0') break;
		linebuf[CONTENT_X + i] = text[src];
	}

	font_set(font_inverse);
	gotoxy(0, row);
	printf("%s", linebuf);
	font_set(font_normal);
}

static void draw_read_bar(uint8_t row, const char * text) {
	draw_read_bar_offset(row, text, 0);
}

static void append_text(char * dst, uint8_t * pos, const char * src, uint8_t max_len) {
	while (*src != '\0' && *pos < max_len) {
		dst[*pos] = *src;
		(*pos)++;
		src++;
	}
}

static void append_uint(char * dst, uint8_t * pos, uint16_t value, uint8_t max_len) {
	char buf[6];
	uint8_t count = 0;
	uint8_t i;

	if (value == 0) {
		if (*pos < max_len) {
			dst[*pos] = '0';
			(*pos)++;
		}
		return;
	}

	while (value > 0 && count < sizeof(buf)) {
		buf[count++] = (char)('0' + (value % 10));
		value /= 10;
	}

	for (i = 0; i < count && *pos < max_len; i++) {
		dst[*pos] = buf[count - 1 - i];
		(*pos)++;
	}
}

static void clear_rows(uint8_t start_row, uint8_t end_row) {
	uint8_t row;
	for (row = start_row; row <= end_row && row < SCREEN_ROWS; row++) {
		gotoxy(0, row);
		printf("                    ");
	}
}

static uint16_t next_line_advance(const char * text, uint16_t pos) {
	uint8_t i = 0;
	uint8_t last_space = 255;
	char ch;

	if (text[pos] == '\0') return 0;
	if (text[pos] == '\n') return 1;

	while (i < CONTENT_COLS) {
		ch = text[pos + i];
		if (ch == '\0' || ch == '\n') {
			return i;
		}
		if (ch == ' ') {
			last_space = i;
		}
		i++;
	}

	if (last_space != 255) {
		return (uint16_t)last_space + 1;
	}
	return CONTENT_COLS;
}

static uint16_t total_lines(const char * text) {
	uint16_t pos = 0;
	uint16_t lines = 0;
	uint16_t step;

	while (text[pos] != '\0') {
		step = next_line_advance(text, pos);
		if (step == 0) break;
		pos += step;
		if (text[pos] == '\n') pos++;
		lines++;
	}

	return lines;
}

static uint16_t advance_lines(const char * text, uint16_t pos, uint16_t count) {
	uint16_t step;
	while (count > 0 && text[pos] != '\0') {
		step = next_line_advance(text, pos);
		if (step == 0) break;
		pos += step;
		if (text[pos] == '\n') pos++;
		count--;
	}
	return pos;
}

static void prepare_read_post(void) {
	const char * body = BLOG_POSTS[selected_post].body;
	read_total_line_count = total_lines(body);
	read_max_offset = (read_total_line_count > READ_ROWS) ? (uint16_t)(read_total_line_count - READ_ROWS) : 0;
	if (read_line_offset > read_max_offset) {
		read_line_offset = read_max_offset;
	}
	read_pos_offset = advance_lines(body, 0, read_line_offset);
}

static void print_line_segment(const char * text, uint16_t start, uint8_t row) {
	uint16_t step = next_line_advance(text, start);
	char linebuf[SCREEN_COLS + 1];
	uint8_t i;

	for (i = 0; i < SCREEN_COLS; i++) linebuf[i] = ' ';
	linebuf[SCREEN_COLS] = '\0';

	if (step > CONTENT_COLS) step = CONTENT_COLS;
	for (i = 0; i < step && text[start + i] != '\0' && text[start + i] != '\n'; i++) {
		linebuf[CONTENT_X + i] = text[start + i];
	}

	gotoxy(0, row);
	printf("%s", linebuf);
}

static uint8_t text_len_u8(const char * text) {
	uint8_t n = 0;
	while (text[n] != '\0' && n < 255) n++;
	return n;
}

static void draw_read_header(void) {
	draw_read_bar_offset(0, BLOG_POSTS[selected_post].title, read_title_scroll);
}

static uint8_t step_read_header_scroll(void) {
	const char * title = BLOG_POSTS[selected_post].title;
	uint8_t title_len = text_len_u8(title);
	uint8_t max_scroll;

	if (title_len <= CONTENT_COLS) return 0;

	if (read_title_wait > 0) {
		read_title_wait--;
		return 0;
	}

	max_scroll = (uint8_t)(title_len - CONTENT_COLS);
	if (read_title_scroll < max_scroll) {
		read_title_scroll++;
		read_title_wait = HEADER_SCROLL_STEP_DELAY;
		return 1;
	}

	read_title_scroll = 0;
	read_title_wait = HEADER_SCROLL_START_DELAY + HEADER_SCROLL_END_DELAY;
	return 1;
}

static void draw_list_row(uint8_t row) {
	uint8_t idx;
	char marker;
	char linebuf[SCREEN_COLS + 1];
	uint8_t i;

	idx = list_scroll + row;
	gotoxy(0, row + 1);
	if (idx < BLOG_POST_COUNT) {
		marker = (idx == selected_post) ? '>' : ' ';
		for (i = 0; i < SCREEN_COLS; i++) linebuf[i] = ' ';
		linebuf[SCREEN_COLS] = '\0';
		linebuf[0] = marker;
		for (i = 0; i < 19 && BLOG_POSTS[idx].title[i] != '\0'; i++) {
			linebuf[i + 1] = BLOG_POSTS[idx].title[i];
		}
		printf("%s", linebuf);
	} else {
		printf("                    ");
	}
}

static void draw_list_view(void) {
	uint8_t row;

	draw_bar(0, "GlobalClaw GB Blog");
	for (row = 0; row < LIST_ROWS; row++) {
		draw_list_row(row);
	}
	draw_bar(SCREEN_ROWS - 1, "A:Open B:Top ^v:Sel");
}

static void draw_read_view(void) {
	const char * body = BLOG_POSTS[selected_post].body;
	uint16_t pos = read_pos_offset;
	uint8_t rendered = 0;
	uint16_t step;
	char status[SCREEN_COLS + 1];
	uint8_t status_pos = 0;

	draw_read_header();
	clear_rows(1, SCREEN_ROWS - 2);

	while (body[pos] != '\0' && rendered < READ_ROWS) {
		print_line_segment(body, pos, rendered + 1);
		step = next_line_advance(body, pos);
		if (step == 0) break;
		pos += step;
		if (body[pos] == '\n') pos++;
		rendered++;
	}

	status[0] = '\0';
	append_text(status, &status_pos, "B:Back ^v:Page ", CONTENT_COLS);
	append_uint(status, &status_pos, (uint16_t)(read_line_offset + 1), CONTENT_COLS);
	append_text(status, &status_pos, "/", CONTENT_COLS);
	append_uint(status, &status_pos, (uint16_t)(read_total_line_count == 0 ? 1 : read_total_line_count), CONTENT_COLS);
	status[status_pos] = '\0';
	draw_read_bar(SCREEN_ROWS - 1, status);
}

static void list_up(void) {
	if (selected_post == 0) return;
	selected_post--;
	if (selected_post < list_scroll) list_scroll = selected_post;
}

static void list_down(void) {
	if (selected_post + 1 >= BLOG_POST_COUNT) return;
	selected_post++;
	if (selected_post >= list_scroll + LIST_ROWS) {
		list_scroll = selected_post - LIST_ROWS + 1;
	}
}

static void read_page_up(void) {
	const char * body = BLOG_POSTS[selected_post].body;
	uint16_t target_offset;

	if (read_line_offset >= READ_ROWS) {
		target_offset = (uint16_t)(read_line_offset - READ_ROWS);
	} else {
		target_offset = 0;
	}
	if (target_offset != read_line_offset) {
		read_line_offset = target_offset;
		read_pos_offset = advance_lines(body, 0, read_line_offset);
	}
}

static void read_page_down(void) {
	const char * body = BLOG_POSTS[selected_post].body;
	uint16_t target_offset;
	uint16_t delta;

	if (read_line_offset < read_max_offset) {
		target_offset = (uint16_t)(read_line_offset + READ_ROWS);
		if (target_offset > read_max_offset) {
			target_offset = read_max_offset;
		}
		delta = (uint16_t)(target_offset - read_line_offset);
		read_pos_offset = advance_lines(body, read_pos_offset, delta);
		read_line_offset = target_offset;
	}
}

void main(void) {
	uint8_t keys;
	uint8_t old_selected;
	uint8_t old_scroll;
	uint8_t i;
	music_init();
	font_init();
	set_normal_colors();
	font_normal = font_load(font_ibm);
	set_bar_colors();
	font_inverse = font_load(font_ibm);
	font_set(font_normal);
	mode(M_NO_SCROLL);
	crab_init();

	DISPLAY_ON;
	for (i = 0; i < 4; i++) {
		wait_vbl_done();
	}
	has_sgb = sgb_check();
	apply_color_theme();
	draw_list_view();

	while (1) {
		keys = joypad();
		music_update();
		crab_update();

		if (current_view == VIEW_LIST) {
			if (keys & J_UP) {
				old_selected = selected_post;
				old_scroll = list_scroll;
				list_up();
				if (list_scroll != old_scroll) {
					draw_list_view();
				} else if (selected_post != old_selected) {
					draw_list_row((uint8_t)(old_selected - list_scroll));
					draw_list_row((uint8_t)(selected_post - list_scroll));
				}
			}
			if (keys & J_DOWN) {
				old_selected = selected_post;
				old_scroll = list_scroll;
				list_down();
				if (list_scroll != old_scroll) {
					draw_list_view();
				} else if (selected_post != old_selected) {
					draw_list_row((uint8_t)(old_selected - list_scroll));
					draw_list_row((uint8_t)(selected_post - list_scroll));
				}
			}
			if (keys & J_A) {
				current_view = VIEW_READ;
				read_line_offset = 0;
				read_title_scroll = 0;
				read_title_wait = HEADER_SCROLL_START_DELAY;
				prepare_read_post();
				draw_read_view();
			}
			if (keys & J_B) {
				if (selected_post != 0 || list_scroll != 0) {
					selected_post = 0;
					list_scroll = 0;
					draw_list_view();
				}
			}
		} else {
			if (step_read_header_scroll()) {
				draw_read_header();
			}
			if (keys & J_UP) {
				read_page_up();
				draw_read_view();
			}
			if (keys & J_DOWN) {
				read_page_down();
				draw_read_view();
			}
			if (keys & J_B) {
				current_view = VIEW_LIST;
				draw_list_view();
			}
		}

		wait_vbl_done();
		delay(50);
	}
}
