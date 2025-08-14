import math

def sine_interpolate(value, start, end):
    return start + (end - start) * (1 - math.cos(value * math.pi)) / 2

def generate_keyframes_with_interpolation(pairs, additional_transforms=None, num_intermediate_points=10):
    keyframes_name = "animate-pendulum"
    keyframes_rules = []

    for i in range(len(pairs) - 1):
        start_percent, start_angle = pairs[i]
        end_percent, end_angle = pairs[i + 1]

        percent_step = (end_percent - start_percent) / (num_intermediate_points + 1)
        angle_step = (end_angle - start_angle) / (num_intermediate_points + 1)

        for j in range(num_intermediate_points + 2):
            current_percent = start_percent + j * percent_step
            current_angle = sine_interpolate(j / (num_intermediate_points + 1), start_angle, end_angle)

            transform_rules = f"rotate({current_angle}deg)"

            if additional_transforms:
                transform_rules += " " + " ".join(additional_transforms)

            keyframes_rules.append(f"{current_percent:.2f}% {{\n    transform: {transform_rules};\n}}")

    keyframes_css = f"@keyframes {keyframes_name} {{\n" + "\n".join(keyframes_rules) + "\n}"

    return keyframes_css

# Example usage
pairs = [
    (0, -10),
    (1/6*100, 10),
    (2/6*100, -10),
    (3/6*100, 10),
    (4/6*100, -10),
    (5/6*100, 370),
    (6/6*100, 350),
]

additional_transforms = ["scaleX(56%)"]
num_intermediate_points = 10

css_output = generate_keyframes_with_interpolation(pairs, additional_transforms, num_intermediate_points)
print(css_output)
