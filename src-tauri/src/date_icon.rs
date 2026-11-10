//! 托盘狗牌图标：每天一枚黄铜狗牌，牌面刻当日日期数字。
//! 设计签名元素——Luna 的狗牌，刻的不是名字，是日期。

use std::sync::OnceLock;

use tauri::image::Image;

const SIZE: usize = 32;
/// 黄铜牌面 / 描边 / 刻字
const BRASS: [u8; 3] = [209, 168, 96];
const BRASS_DARK: [u8; 3] = [126, 91, 36];
const INK: [u8; 3] = [61, 42, 10];

struct Canvas {
    w: usize,
    h: usize,
    px: Vec<u8>,
}

impl Canvas {
    fn new(w: usize, h: usize) -> Self {
        Self {
            w,
            h,
            px: vec![0u8; w * h * 4],
        }
    }

    /// source-over 混合（straight alpha）
    fn blend(&mut self, x: i32, y: i32, color: [u8; 3], alpha: u8) {
        if x < 0 || y < 0 || x >= self.w as i32 || y >= self.h as i32 || alpha == 0 {
            return;
        }
        let idx = ((y as usize) * self.w + x as usize) * 4;
        let sa = alpha as u32;
        let da = self.px[idx + 3] as u32;
        let out_a = sa + da * (255 - sa) / 255;
        if out_a == 0 {
            return;
        }
        for c in 0..3 {
            let sc = color[c] as u32;
            let dc = self.px[idx + c] as u32;
            let out_c = (sc * sa + dc * da * (255 - sa) / 255) / out_a;
            self.px[idx + c] = out_c.min(255) as u8;
        }
        self.px[idx + 3] = out_a.min(255) as u8;
    }

    fn punch(&mut self, x: i32, y: i32, coverage: f32) {
        if x < 0 || y < 0 || x >= self.w as i32 || y >= self.h as i32 {
            return;
        }
        let idx = ((y as usize) * self.w + x as usize) * 4;
        let keep = (1.0 - coverage.clamp(0.0, 1.0)) * self.px[idx + 3] as f32;
        self.px[idx + 3] = keep as u8;
    }

    fn fill_round_rect(
        &mut self,
        x0: f32,
        y0: f32,
        x1: f32,
        y1: f32,
        radius: f32,
        color: [u8; 3],
    ) {
        for py in y0 as i32..=(y1 as i32) {
            for px in x0 as i32..=(x1 as i32) {
                let fx = px as f32 + 0.5;
                let fy = py as f32 + 0.5;
                if inside_round_rect(fx, fy, x0, y0, x1, y1, radius) {
                    self.blend(px, py, color, 255);
                }
            }
        }
    }

    fn stroke_circle(&mut self, cx: f32, cy: f32, radius: f32, thickness: f32, color: [u8; 3]) {
        let inner = radius - thickness / 2.0;
        let outer = radius + thickness / 2.0;
        let min = (cy - outer).floor() as i32;
        let max = (cy + outer).ceil() as i32;
        for py in (min - 1)..=(max + 1) {
            for cpx in (min - 1)..=(max + 1) {
                let d = dist(cx, cy, cpx as f32 + 0.5, py as f32 + 0.5);
                if d > outer || d < inner {
                    continue;
                }
                // 边缘 1px 抗锯齿
                let cov_edge = (outer - d).min(d - inner).min(1.0);
                let alpha = (cov_edge * 255.0) as u8;
                self.blend(cpx, py, color, alpha);
            }
        }
    }

    fn punch_circle(&mut self, cx: f32, cy: f32, radius: f32) {
        let min = (cy - radius).floor() as i32 - 1;
        let max = (cy + radius).ceil() as i32 + 1;
        for py in min..=max {
            for cpx in min..=max {
                let d = dist(cx, cy, cpx as f32 + 0.5, py as f32 + 0.5);
                let cov = (radius - d + 0.5).clamp(0.0, 1.0);
                if cov > 0.0 {
                    self.punch(cpx, py, cov);
                }
            }
        }
    }
}

fn dist(x0: f32, y0: f32, x1: f32, y1: f32) -> f32 {
    ((x1 - x0).powi(2) + (y1 - y0).powi(2)).sqrt()
}

fn inside_round_rect(x: f32, y: f32, x0: f32, y0: f32, x1: f32, y1: f32, r: f32) -> bool {
    if x < x0 || x > x1 || y < y0 || y > y1 {
        return false;
    }
    let cx = if x < x0 + r {
        x0 + r
    } else if x > x1 - r {
        x1 - r
    } else {
        x
    };
    let cy = if y < y0 + r {
        y0 + r
    } else if y > y1 - r {
        y1 - r
    } else {
        y
    };
    (x - cx).powi(2) + (y - cy).powi(2) <= r * r
}

fn font() -> Option<&'static fontdue::Font> {
    static FONT: OnceLock<Option<fontdue::Font>> = OnceLock::new();
    FONT.get_or_init(|| {
        fontdue::Font::from_bytes(
            include_bytes!("../resources/Baloo2-Variable.ttf").as_slice(),
            fontdue::FontSettings {
                collection_index: 0,
                scale: 40.0,
                load_substitutions: true,
            },
        )
        .ok()
    })
    .as_ref()
}

pub fn draw_day(day: u32) -> Image<'static> {
    let mut c = Canvas::new(SIZE, SIZE);
    // 挂环
    c.stroke_circle(16.0, 6.0, 3.6, 1.6, BRASS_DARK);
    // 牌体：先深色一层再浅色一层，留出 1px 描边
    c.fill_round_rect(4.0, 8.0, 28.0, 30.0, 6.0, BRASS_DARK);
    c.fill_round_rect(5.0, 9.0, 27.0, 29.0, 5.0, BRASS);
    // 牌孔打穿
    c.punch_circle(16.0, 6.0, 1.8);
    // 刻日期数字；字体不可用时退化为爪印
    if let Some(f) = font() {
        draw_digits(&mut c, f, day);
    } else {
        draw_paw(&mut c);
    }
    Image::new_owned(c.px, SIZE as u32, SIZE as u32)
}

fn draw_digits(c: &mut Canvas, font: &fontdue::Font, day: u32) {
    let text = day.to_string();
    let px = if text.chars().count() >= 2 { 12.0 } else { 15.0 };
    let baseline = 25.0_f32;
    let total_w: f32 = text
        .chars()
        .map(|ch| font.rasterize(ch, px).0.advance_width)
        .sum();
    let mut pen_x = 16.0 - total_w / 2.0;
    for ch in text.chars() {
        let (metrics, bitmap) = font.rasterize(ch, px);
        let screen_x = (pen_x + metrics.xmin as f32) as i32;
        // fontdue 的 ymin 向上为正，位图第 0 行是字形顶部
        let top_y = (baseline - metrics.ymin as f32) as i32;
        for gy in 0..metrics.height {
            for gx in 0..metrics.width {
                let cov = bitmap[gy * metrics.width + gx];
                if cov > 0 {
                    c.blend(screen_x + gx as i32, top_y - gy as i32 - 1, INK, cov);
                }
            }
        }
        pen_x += metrics.advance_width;
    }
}

/// 字体加载失败时的兜底：一枚爪印
fn draw_paw(c: &mut Canvas) {
    for (tx, ty) in [(11.5, 17.0), (16.0, 15.5), (20.5, 17.0)] {
        for py in -2..=2 {
            for px in -2..=2 {
                let d = dist(px as f32, py as f32, 0.0, 0.0);
                if d <= 1.9 {
                    let cx = tx as i32 + px;
                    let cy = ty as i32 + py;
                    c.blend(cx, cy, BRASS_DARK, 255);
                }
            }
        }
    }
    // 掌垫（椭圆近似）
    for py in 0..5 {
        let half_w = match py {
            0 => 1.5,
            1 => 2.5,
            2 => 3.0,
            3 => 2.5,
            _ => 1.5,
        };
        for px in -3..=3 {
            if (px as f32).abs() <= half_w {
                c.blend(16 + px, 20 + py, BRASS_DARK, 255);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn baloo_font_parses() {
        assert!(font().is_some(), "Baloo 2 字体应可解析");
    }

    #[test]
    fn digits_rasterize() {
        let f = font().expect("字体应可用");
        for ch in "1234567890".chars() {
            let (m, bitmap) = f.rasterize(ch, 12.0);
            assert!(m.width > 0 && m.height > 0, "字符 {ch} 应有位图");
            assert!(bitmap.iter().any(|&c| c > 0), "字符 {ch} 位图不应全空");
        }
    }

    #[test]
    fn icon_has_tag_shape() {
        let img = draw_day(10);
        assert_eq!(img.width(), SIZE as u32);
        assert_eq!(img.height(), SIZE as u32);
        let rgba = img.rgba();
        // 牌体中心应有内容
        let idx = (20 * SIZE + 16) * 4;
        assert_eq!(rgba[idx + 3], 255, "牌体中心应不透明");
        // 牌孔应被打通
        let hole = (7 * SIZE + 16) * 4;
        assert_eq!(rgba[hole + 3], 0, "牌孔应透明");
    }
}
