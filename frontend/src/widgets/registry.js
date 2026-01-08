import PowerWidget from "./PowerWidget";
import TemperatureWidget from "./TemperatureWidget";
import BooleanWidget from "./BooleanWidget";
import TextWidget from "./TextWidget";
import ChartWidget from "./ChartWidget";

export const WIDGET_TYPES = {
  power: { component: PowerWidget },
  temperature: { component: TemperatureWidget },
  boolean: { component: BooleanWidget },
  text: { component: TextWidget },
  chart: { component: ChartWidget }
};
