import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";
import { Book } from "./bookTypes";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    console.log("files", files);
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      fileName
    );

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-cover",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookUploadResult = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: bookFileName,
      folder: "book-pdfs",
      format: "pdf",
    });

    console.log("bookUploadResult", bookUploadResult);

    console.log("uploadResult", uploadResult);

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookUploadResult.secure_url,
    });

    // Delete temp files

    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (error) {
    console.log("error", error);
    return next(createHttpError(500, "Error while uploading the files."));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;

  const bookId = req.params.bookId;

  if (!bookId) {
    return next(createHttpError(404, "BookId not found."));
  }

  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found."));
  }

  // Check access

  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You cannot update others book."));
  }

  // destroy previous files from cloudinary

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  let completeCoverImage = "";
  if (files.coverImage) {
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const fileName = files.coverImage[0].filename;

    // send files to cloudinary
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      fileName
    );

    // completeCoverImage = `${fileName}.${coverImageMimeType}`

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-cover",
      format: coverImageMimeType,
    });

    completeCoverImage = uploadResult.secure_url;
    await fs.promises.unlink(filePath);
  }

  let completeFileName = "";

  if (files.file) {
    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookUploadResult = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: bookFileName,
      folder: "book-pdfs",
      format: "pdf",
    });

    completeFileName = bookUploadResult.secure_url;
    await fs.promises.unlink(bookFilePath);
  }

  // update book

  const updatedBook = await bookModel.findOneAndUpdate(
    {
      _id: bookId,
    },
    {
      title,
      genre,
      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    {
      new: true,
    }
  );

  return res.json(updatedBook);
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add pagination
    const books = await bookModel.find();
    return res.status(200).json(books);
  } catch (err) {
    return next(createHttpError(500, "Error while getting books."));
  }
};

const singleBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found."));
    }

    return res.status(200).json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting book."));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  let book: Book | null;
  try {
    book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found."));
    }
  } catch (error) {
    return next(createHttpError(500, "Error while getting book."));
  }

  // Check access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You can't delete other book."));
  }

  try {
    const coverImageSplit = book.coverImage.split("/");
    const coverImageId = `${coverImageSplit.at(-2)}/${coverImageSplit
      .at(-1)
      ?.split(".")
      .at(-2)}`;

    const bookFileSplit = book.file.split("/");
    const bookFileId = `${bookFileSplit.at(-2)}/${bookFileSplit.at(-1)}`;

    await cloudinary.uploader.destroy(coverImageId);
    await cloudinary.uploader.destroy(bookFileId, {
      resource_type: "raw",
    });

    await bookModel.deleteOne({ _id: bookId });

    return res.sendStatus(204);
  } catch (error) {
    return next(createHttpError(500, "Error while delete book."));
  }
};

export { createBook, updateBook, listBooks, singleBook, deleteBook };
