/**
 *
 * @param {string} month
 */
export function getMonthNumber(month) {
  switch (month.toLocaleLowerCase()) {
    case 'enero':
      return '0';
    case 'febrero':
      return '1';
    case 'marzo':
      return '2';
    case 'abril':
      return '3';
    case 'mayo':
      return '4';
    case 'junio':
      return '5';
    case 'julio':
      return '6';
    case 'agosto':
      return '7';
    case 'septiembre':
      return '8';
    case 'octubre':
      return '9';
    case 'noviembre':
      return '10';
    case 'diciembre':
      return '11';
    default:
      throw new Error('Invalid month');
  }
}
