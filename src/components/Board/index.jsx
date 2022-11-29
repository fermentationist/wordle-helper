import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import Square, { COLORS } from "../Square";
import Keyboard from "../Keyboard";
import wordList from "./words.js";
import { getRemainingWords } from "./wordle.js";
import { getRandomArrayMembers } from "../../util/helpers";

const InputRows = styled.div`
  height: auto;
  display: flex;
  flex-direction: column;
  place-items: center;
`;

const Container = styled.main`
  max-width: 100vw;
  max-height: 95vh;
  min-height: max(85vh, 600px);
  display: flex;
  flex-direction: column;
  gap: 1em;
  place-items: center;
  @media screen and (min-width: 1280px) and (hover: hover) {
    display: grid;
    grid-template-columns: 1fr 2fr;
    place-items: center;
  }
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  height: auto;
  @media screen and (min-width: 1280px) and (hover: hover) {
    max-width: 25vw;
  }
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: column;
  place-items: center;
`;

const WordsSection = styled.div`
  display: flex;
  flex-direction: column;
  place-items: center;
`;

const Title = styled.title`
  display: block;
`;

const WordsContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: clamp(21em, 85vw, 600px);
  max-height: ${(props) => `calc(50vh - calc(${props.numRows} * 4em))`};
  flex-wrap: wrap;
  border: 1px solid gray;
  border-radius: 5px;
  overflow-y: scroll;
  @media screen and (min-width: 1280px) and (hover: hover) {
    width: clamp(600px, 60vw, 66vw);
    max-height: 75vh;
  }
`;

const WordButton = styled.button`
  height: 2em;
  margin: 0.25em;
  text-align: center;
  line-height: 0.5em;
  padding: 0.25em;
`;

const EnterButton = styled.button`
  height: 2em;
  margin: 0.5em 0.5em 0 0.5em;
  text-align: center;
  line-height: 0.5em;
  padding: 0 0.5em;
  background-color: ${COLORS["green"]};
  color: ivory;
`;

const ResetButton = styled.button`
  height: 2em;
  margin: 0.5em 0.5em 0 0.5em;
  text-align: center;
  line-height: 0.5em;
  padding: 0 0.5em;
`;

const KeyboardContainer = styled.div`
  width: clamp(21em, 85vw, 600px);
  /* only show virtual keyboard on mobile */
  @media screen and (hover: hover) {
    display: none;
  }
`;

const Board = ({ wordLength = 5, numTries = 6 }) => {
  const [gameOver, setGameOver] = useState(false);
  const [refreshNum, setRefreshNum] = useState(Math.random());
  const [solved, setSolved] = useState(false);
  const emptyRow = Array(wordLength).fill(null);
  const emptyColorRow = Array(wordLength).fill("gray");
  const currentIndex = useRef(0);
  const appliedFilters = useRef([]);
  // "overriding" setPossibleWords because you cannot access the most current state from within an event handler
  const [possibleWords, _setPossibleWords] = useState(wordList);
  const possibleWordsRef = useRef(wordList);
  const setPossibleWords = (newState) => {
    possibleWordsRef.current = newState;
    _setPossibleWords(newState);
  };
  // "overriding" setRows because you cannot access the most current state from within an event handler
  const [rows, _setRows] = useState([[...emptyRow]]);
  const rowsRef = useRef([[...emptyRow]]);
  const setRows = (newState) => {
    rowsRef.current = newState;
    _setRows(newState);
  };
  const colorRowsRef = useRef([[...emptyColorRow]]);

  useEffect(() => {
    const wordsSection = document.getElementById("words-container");
    if (gameOver === true) {
      window.removeEventListener("keydown", onKeyDown);
      wordsSection.removeEventListener("click", onWordClick);
      wordsSection.style.display = "none";
    } else {
      window.addEventListener("keydown", onKeyDown);
      wordsSection.addEventListener("click", onWordClick);
      wordsSection.style.display = "block";
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      wordsSection.removeEventListener("click", onWordClick);
    };
  }, [gameOver]);

  const rowIsComplete = (row) => {
    return !row.some((char) => char === null);
  };

  const filterWords = () => {
    const filterMap = rowsRef.current[currentIndex.current].reduce(
      (map, char, index) => {
        const filter = {
          index,
          color: colorRowsRef.current[currentIndex.current][index],
        };
        if (!(char in map)) {
          map[char] = [filter];
        } else {
          map[char].push(filter);
        }
        return map;
      },
      {}
    );
    appliedFilters.current = filterMap;
    const remaining = getRemainingWords(
      possibleWordsRef.current,
      appliedFilters.current
    );
    setPossibleWords(remaining);
  };

  const addNewRow = () => {
    currentIndex.current++;
    const rowsCopy = [...rowsRef.current];
    rowsCopy[currentIndex.current] = [...emptyRow];
    setRows(rowsCopy);
    const colorRowsCopy = [...colorRowsRef.current];
    colorRowsCopy[currentIndex.current] = [...emptyColorRow];
    colorRowsRef.current = colorRowsCopy;
  };

  const handleEnter = () => {
    const currentRowIsComplete = rowIsComplete(
      rowsRef.current[currentIndex.current]
    );
    if (currentRowIsComplete && currentIndex.current < numTries - 1) {
      filterWords();
      if (possibleWordsRef.current.length < 1) {
        setGameOver(true);
      } else {
        addNewRow();
      }
      if (possibleWordsRef.current.length === 1) {
        selectWord(possibleWordsRef.current[0]);
        setSolved(true);
        setGameOver(true);
      }
    }
  };

  const handleDelete = () => {
    const deleteIndex =
      rowsRef.current[currentIndex.current].indexOf(null) === -1
        ? rowsRef.current[currentIndex.current].length - 1
        : rowsRef.current[currentIndex.current].indexOf(null) - 1;
    if (deleteIndex >= 0) {
      const rowsCopy = [...rowsRef.current];
      const rowCopy = [...rowsRef.current[currentIndex.current]];
      rowCopy[deleteIndex] = null;
      rowsCopy[currentIndex.current] = rowCopy;
      setRows(rowsCopy);
      return;
    }
  };

  const handleChar = (char) => {
    const nextCharIndex = rowsRef.current[currentIndex.current].indexOf(null);
    if (nextCharIndex !== -1) {
      // if there is a blank space available
      const rowsCopy = [...rowsRef.current];
      const currentRow = [...rowsRef.current[currentIndex.current]];
      currentRow[nextCharIndex] = char.toUpperCase();
      rowsCopy[currentIndex.current] = currentRow;
      setRows(rowsCopy);
    }
  };

  const onKeyDown = (event) => {
    // onKeyDown event listener
    if (event.key === "Enter") {
      // ENTER
      event.preventDefault();
      handleEnter();
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      // DELETE
      handleDelete();
    }
    const allowedChars = /^[a-zA-Z]$/;
    if (allowedChars.test(event.key)) {
      // VALID LETTER
      handleChar(event.key.toUpperCase());
    }
  };

  const onWordClick = (event) => {
    if (event.target.dataset.word) {
      selectWord(event.target.dataset.word);
    }
  };

  const colorChangeCallback = (index, color) => {
    const rowsCopy = [...colorRowsRef.current];
    const rowCopy = rowsCopy[currentIndex.current];
    rowCopy[index] = color;
    rowsCopy[currentIndex.current] = rowCopy;
    colorRowsRef.current = rowsCopy;
  };

  const selectWord = (word) => {
    const rowsCopy = [...rowsRef.current];
    rowsCopy[currentIndex.current] = word.toUpperCase().split("");
    setRows(rowsCopy);
  };

  const resetBoard = () => {
    setGameOver(false);
    setSolved(false);
    setPossibleWords(wordList);
    currentIndex.current = 0;
    colorRowsRef.current = [[...emptyColorRow]];
    setRefreshNum(Math.random());
    setRows([[...emptyRow]]);
    appliedFilters.current = [];
  };

  const onVirtualKeypress = (key) => {
    if (!gameOver) {
      switch (key) {
        case "{enter}":
          return handleEnter();
        case "{bksp}":
          return handleDelete();
        default:
          return handleChar(key);
      }
    }
  };

  const chooseRandom = () => {
    const [word] = getRandomArrayMembers(possibleWordsRef.current, 1);
    selectWord(word);
  };

  return (
    <Container>
      <InputRows id="input-rows">
        {rows.map((row, rowsIndex) => {
          return (
            <RowContainer key={`row-${rowsIndex}`}>
              <Row>
                {row.map((char, index) => {
                  return (
                    <Square
                      char={char}
                      key={`row-${rowsIndex}-square-${index}`}
                      callback={colorChangeCallback.bind(null, index)}
                      active={currentIndex.current === rowsIndex && !gameOver}
                      startColor={solved ? "green" : "gray"}
                      refreshNum={refreshNum}
                    />
                  );
                })}
              </Row>
            </RowContainer>
          );
        })}
        <div>
          {possibleWords.length > 1 ? (
            <>
              <ResetButton onClick={chooseRandom}>RANDOM</ResetButton>
            </>
          ) : null}
          {rowIsComplete(rowsRef.current[currentIndex.current]) &&
          currentIndex.current < numTries - 1 &&
          !gameOver ? (
            <EnterButton onClick={handleEnter} key="enter-button">
              ENTER
            </EnterButton>
          ) : null}
          <ResetButton onClick={resetBoard}>RESET</ResetButton>
        </div>
      </InputRows>
      <KeyboardContainer>
        <Keyboard onKeyPress={onVirtualKeypress} />
      </KeyboardContainer>
      <WordsSection>
        <Title>
          {possibleWords.length === 1
            ? ""
            : `${possibleWords.length} POSSIBLE WORDS`}
        </Title>
        <WordsContainer id="words-container" numRows={rowsRef.current.length}>
          {possibleWords.map((word, index) => {
            return (
              <WordButton key={index} data-word={word}>
                {word}
              </WordButton>
            );
          })}
        </WordsContainer>
      </WordsSection>
    </Container>
  );
};

export default Board;
