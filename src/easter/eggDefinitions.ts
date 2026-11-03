/**
 * eggDefinitions.ts — Data for the six Halloween Easter eggs.
 * Each egg has: id, position, radius, trigger type, lore title and text, sprite keys.
 */

export type EggTriggerType = 'area' | 'f-key' | 'triple-f' | 'still';

export interface EggDefinition {
  id: string;
  x: number;
  y: number;
  radius: number;
  triggerType: EggTriggerType;
  title: string;
  text: string;
  spriteKey?: string;
  iconKey?: string;
}

export const EGG_DEFINITIONS: EggDefinition[] = [
  {
    id: 'black_cat',
    x: 860,
    y: 870,
    radius: 50,
    triggerType: 'area',
    title: 'A black cat crossed your path!',
    text: 'In old European folklore, black cats were said to be witches\' companions, or even witches in disguise, so one crossing your path meant bad luck. Not everywhere agrees: in Scotland and Japan a black cat is a sign of good fortune. On Halloween they\'re simply the season\'s mascot.',
    spriteKey: 'black_cat_walk',
  },
  {
    id: 'jack_pumpkin',
    x: 980,
    y: 1134,
    radius: 40,
    triggerType: 'f-key',
    title: 'The legend of Stingy Jack',
    text: 'Irish folklore tells of Stingy Jack, a trickster who fooled the Devil twice. When he died, neither Heaven nor Hell would take him, so he wanders the night with a coal glowing inside a carved turnip. People carved scary faces into turnips to keep him away. Irish immigrants in America found pumpkins bigger and easier to carve: the jack-o\'-lantern.',
    spriteKey: 'pumpkin_plain',
    iconKey: 'turnip_lantern',
  },
  {
    id: 'grave_13',
    x: 2172,
    y: 820,
    radius: 40,
    triggerType: 'f-key',
    title: 'The 13th grave',
    text: 'Many people in the West consider 13 unlucky, a fear called triskaidekaphobia. One story points to the Last Supper, where Judas was the 13th guest; a popular retelling of a Norse myth has the trickster Loki crash a feast of 12 gods. Some buildings still skip the 13th floor, and Friday the 13th is the unluckiest day of all.',
  },
  {
    id: 'crypt_knock',
    x: 600,
    y: 935,
    radius: 56,
    triggerType: 'f-key',
    title: 'Trick or treat!',
    text: 'Halloween grew from Samhain, a Celtic festival marking summer\'s end, when the boundary with the spirit world was thought to thin. In medieval Britain and Ireland the poor went \'souling\' door to door, praying for the dead in return for soul cakes; in Scotland, children in costume went \'guising\' and performed for treats. Today it\'s knock, say \'trick or treat!\', and collect candy.',
    spriteKey: 'crypt',
  },
  {
    id: 'mirror_well',
    x: 2180,
    y: 500,
    radius: 72,
    triggerType: 'triple-f',
    title: 'Bloody Mary in the well',
    text: 'An old Halloween party game: at midnight, gaze into a mirror (or a still well) by candlelight and you might glimpse the face of the person you\'ll marry. Folklorists think it may have grown into the sleepover dare of chanting \'Bloody Mary\' three times at a mirror to summon a ghost. This one only wanted to say hello.',
    spriteKey: 'well',
  },
  {
    id: 'moon_howl',
    x: 1088,
    y: 1680,
    radius: 48,
    triggerType: 'still',
    title: 'Howling at the moon',
    text: 'European legends told of werewolves: people who turned into wolves under the full moon. The moon was blamed for odd behaviour too; \'lunatic\' comes from luna, Latin for moon. Real wolves don\'t actually howl at the moon. They howl to call their pack, and lift their heads so the sound carries.',
    spriteKey: 'wolf_spirit',
  },
  {
    id: 'zombie_hand',
    x: 1400,
    y: 1612,
    radius: 44,
    triggerType: 'f-key',
    title: 'Where zombies come from',
    text: "Zombies began in Haitian folklore: the zonbi, a person said to be raised by a sorcerer (a bokor) and made to work with no will of their own. Hollywood borrowed the idea in White Zombie (1932), and George A. Romero's Night of the Living Dead (1968) turned them into the slow, hungry hordes we know today, though Romero called them ghouls.",
    spriteKey: 'zombie_hand',
  },
];

export function getEggById(id: string): EggDefinition | undefined {
  return EGG_DEFINITIONS.find(egg => egg.id === id);
}
